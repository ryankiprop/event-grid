import { useEffect, useState } from 'react'
import { getMyOrders } from '../../services/orders'
import { Link } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { Printer, Ticket, Calendar, Clock, MapPin } from 'lucide-react'

export default function UserDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const loadOrders = async () => {
      try {
        const res = await getMyOrders()
        if (!mounted) return
        
        // Process orders to extract individual tickets
        const processedOrders = (res.orders || []).flatMap(order => 
          (order.items || []).flatMap(item => 
            Array.from({ length: item.quantity || 1 }, (_, index) => ({
              ...item,
              order,
              uniqueId: `${item.id}-${index}`,
              qrValue: item.qr_code || `${order.id}:${item.id}:${index + 1}`,
              // Add event data if available
              event: order.event || {},
              ticket_type: item.ticket_type || { name: 'General Admission' }
            }))
          )
        )
        
        setOrders(processedOrders)
        setError(null)
      } catch (e) {
        if (!mounted) return
        console.error('Error loading orders:', e)
        setError(e?.response?.data?.message || 'Failed to load orders')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    loadOrders()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="flex justify-center p-8">Loading tickets...</div>
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handlePrintTicket = (ticket) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${ticket.event?.title || 'Event'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { padding: 16px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body class="font-sans">
          <div class="max-w-md mx-auto border rounded p-4">
            <div class="text-center mb-4">
              <h1 class="text-xl font-bold">${ticket.event?.title || 'Event Ticket'}</h1>
              <p class="text-gray-600">${ticket.ticket_type?.name || 'General Admission'}</p>
            </div>
            <div class="flex justify-center mb-4">
              <div class="p-2 bg-white">
                <div style={{ height: 'auto', margin: '0 auto', maxWidth: 200, width: '100%' }}>
                  ${document.querySelector(`#qr-${ticket.id}`)?.innerHTML || ''}
                </div>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>${formatDate(ticket.event?.start_time)}</span>
              </div>
              <div class="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span>${formatTime(ticket.event?.start_time)} - ${formatTime(ticket.event?.end_time)}</span>
              </div>
              <div class="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>${ticket.event?.location || 'Venue not specified'}</span>
              </div>
            </div>
            <div class="mt-4 pt-2 border-t">
              <p class="text-xs text-gray-500">Order #${ticket.order_id?.slice(-8) || ''}</p>
              <p class="text-xs text-gray-500">Ticket ID: ${ticket.id?.slice(-8) || ''}</p>
            </div>
          </div>
          <div class="no-print mt-4 text-center">
            <button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Print Ticket
            </button>
            <button onclick="window.close()" class="ml-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Close
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Tickets</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Ticket className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-2">You don't have any tickets yet.</p>
          <Link to="/events" className="text-primary-600 hover:underline">
            Browse upcoming events
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.flatMap(order => 
            <div key={ticket.uniqueId} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{ticket.event?.title || 'Event'}</h3>
                    <p className="text-gray-600">{ticket.ticket_type?.name || 'General Admission'}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ticket.order?.status === 'paid' ? 'bg-green-100 text-green-800' :
                      ticket.order?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.order?.status || 'unknown'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Order #{ticket.order?.id?.slice(-8) || ''}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 md:flex">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6 flex justify-center">
                  <div className="p-2 border rounded bg-white">
                    <div style={{ height: 'auto', margin: '0 auto', maxWidth: 120, width: '100%' }}>
                      <QRCode
                        id={`qr-${ticket.uniqueId}`}
                        size={120}
                        value={ticket.qrValue}
                        viewBox="0 0 120 120"
                        level="H"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Event Date</h4>
                      <p>{ticket.event?.start_time ? formatDate(ticket.event.start_time) : 'TBD'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Time</h4>
                      <p>
                        {ticket.event?.start_time ? formatTime(ticket.event.start_time) : 'TBD'}
                        {ticket.event?.end_time && ` - ${formatTime(ticket.event.end_time)}`}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Location</h4>
                      <p>{ticket.event?.location || 'Venue not specified'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Ticket ID</h4>
                      <p className="font-mono">{ticket.uniqueId}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <button
                      onClick={() => handlePrintTicket(ticket)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Printer className="w-3 h-3 mr-1.5" />
                      Print Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}