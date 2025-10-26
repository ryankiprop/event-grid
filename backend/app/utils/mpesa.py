import base64
import json
import os
import time
import requests

MPESA_ENV = os.getenv('MPESA_ENV', 'sandbox')
CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY', '')
CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET', '')
SHORT_CODE = os.getenv('MPESA_SHORT_CODE', '')
PASSKEY = os.getenv('MPESA_PASSKEY', '')
CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL', '')

TOKEN_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials' if MPESA_ENV == 'sandbox' else 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest' if MPESA_ENV == 'sandbox' else 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'


def _validate_config():
    """Validate that all required M-Pesa environment variables are set"""
    if not CONSUMER_KEY:
        raise ValueError("MPESA_CONSUMER_KEY environment variable is required")
    if not CONSUMER_SECRET:
        raise ValueError("MPESA_CONSUMER_SECRET environment variable is required")
    if not SHORT_CODE:
        raise ValueError("MPESA_SHORT_CODE environment variable is required")
    if not PASSKEY:
        raise ValueError("MPESA_PASSKEY environment variable is required")
    if not CALLBACK_URL:
        raise ValueError("MPESA_CALLBACK_URL environment variable is required")


def _timestamp():
    return time.strftime('%Y%m%d%H%M%S')


def _password():
    ts = _timestamp()
    raw = f"{SHORT_CODE}{PASSKEY}{ts}".encode('utf-8')
    return base64.b64encode(raw).decode('utf-8'), ts


def get_access_token():
    _validate_config()
    auth = (CONSUMER_KEY, CONSUMER_SECRET)
    resp = requests.get(TOKEN_URL, auth=auth, timeout=15)
    resp.raise_for_status()
    return resp.json().get('access_token')


def initiate_stk_push(phone_msisdn: str, amount_kes: int, account_ref: str, description: str):
    _validate_config()
    token = get_access_token()
    password, ts = _password()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    payload = {
        "BusinessShortCode": SHORT_CODE,
        "Password": password,
        "Timestamp": ts,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount_kes,
        "PartyA": phone_msisdn,
        "PartyB": SHORT_CODE,
        "PhoneNumber": phone_msisdn,
        "CallBackURL": CALLBACK_URL,
        "AccountReference": account_ref[:12],
        "TransactionDesc": description[:60]
    }

    # Log the request details for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"M-Pesa STK Push Request: {payload}")

    resp = requests.post(STK_URL, headers=headers, data=json.dumps(payload), timeout=30)

    # Log the response for debugging
    logger.info(f"M-Pesa STK Push Response Status: {resp.status_code}")
    logger.info(f"M-Pesa STK Push Response Body: {resp.text}")

    resp.raise_for_status()
    return resp.json()