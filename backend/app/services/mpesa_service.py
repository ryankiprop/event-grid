import base64
import os
from datetime import datetime, timedelta

import requests
from flask import current_app

class MpesaService:
    def __init__(self):
        self.consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        self.passkey = os.getenv('MPESA_PASSKEY')
        self.shortcode = os.getenv('MPESA_SHORTCODE')
        self.callback_url = os.getenv('MPESA_CALLBACK_URL', f"{os.getenv('BASE_URL')}/api/payments/mpesa/callback")
        self.auth_token = None
        self.token_expiry = None

    def get_auth_token(self):
        if self.auth_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.auth_token

        auth_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        auth = base64.b64encode(f"{self.consumer_key}:{self.consumer_secret}".encode()).decode()
        
        headers = {'Authorization': f'Basic {auth}'}
        
        try:
            response = requests.get(auth_url, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            self.auth_token = data.get('access_token')
            self.token_expiry = datetime.now() + timedelta(seconds=3500)  # Token expires in ~1 hour
            current_app.logger.info("Successfully obtained M-Pesa auth token")
            return self.auth_token
        except Exception as e:
            current_app.logger.error(f"Failed to get M-Pesa auth token: {str(e)}")
            raise Exception("Failed to authenticate with M-Pesa")

    def initiate_stk_push(self, phone, amount, order_id):
        if not all([phone, amount, order_id]):
            raise ValueError("Missing required parameters for STK push")

        # Format phone number to 2547XXXXXXXX
        phone = phone.strip()
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif phone.startswith('+254'):
            phone = phone[1:]
        elif not phone.startswith('254'):
            phone = '254' + phone

        token = self.get_auth_token()
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # Generate password
        password = base64.b64encode(
            f"{self.shortcode}{self.passkey}{timestamp}".encode()
        ).decode()
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone,
            "PartyB": self.shortcode,
            "PhoneNumber": phone,
            "CallBackURL": self.callback_url,
            "AccountReference": str(order_id)[:12],  # Max 12 chars
            "TransactionDesc": f"EventGrid Order {order_id}"
        }

        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        try:
            current_app.logger.info(f"Initiating STK push: {payload}")
            response = requests.post(
                'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            current_app.logger.info(f"STK push response: {data}")
            
            if 'ResponseCode' in data and data['ResponseCode'] == '0':
                return {
                    'success': True,
                    'checkout_request_id': data.get('CheckoutRequestID'),
                    'merchant_request_id': data.get('MerchantRequestID'),
                    'response_description': data.get('ResponseDescription')
                }
            else:
                error_msg = data.get('errorMessage') or data.get('ResponseDescription') or 'Unknown error'
                current_app.logger.error(f"STK push failed: {error_msg}")
                return {
                    'success': False,
                    'message': error_msg
                }
                
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"STK push request failed: {str(e)}")
            return {
                'success': False,
                'message': 'Network error while processing payment'
            }
        except Exception as e:
            current_app.logger.exception("Unexpected error in STK push")
            return {
                'success': False,
                'message': 'An unexpected error occurred'
            }

# Singleton instance
mpesa_service = MpesaService()
