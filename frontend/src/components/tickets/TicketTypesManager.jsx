import { useState, useEffect } from 'react';
import { createTicketType, updateTicketType, deleteTicketType } from '../../services/tickets';

const TicketTypesManager = ({ eventId, initialTicketTypes = [] }) => {
  const [ticketTypes, setTicketTypes] = useState(initialTicketTypes);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity_total: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTicketTypes(initialTicketTypes);
  }, [initialTicketTypes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity_total' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (editingId) {
        // Update existing ticket type
        const updated = await updateTicketType(editingId, formData);
        setTicketTypes(ticketTypes.map(t => t.id === editingId ? updated : t));
        setEditingId(null);
      } else {
        // Create new ticket type
        const newTicket = await createTicketType(eventId, formData);
        setTicketTypes([...ticketTypes, newTicket]);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        quantity_total: '',
      });
      setIsAdding(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save ticket type');
      console.error('Error saving ticket type:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticket) => {
    setFormData({
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price / 100, // Convert from cents to currency
      quantity_total: ticket.quantity_total,
    });
    setEditingId(ticket.id);
    setIsAdding(true);
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket type? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteTicketType(ticketId);
      setTicketTypes(ticketTypes.filter(t => t.id !== ticketId));
    } catch (err) {
      setError('Failed to delete ticket type');
      console.error('Error deleting ticket type:', err);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity_total: '',
    });
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Ticket Types</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add Ticket Type
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded bg-gray-50">
          <h4 className="font-medium mb-3">{editingId ? 'Edit' : 'Add New'} Ticket Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)*</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available*</label>
              <input
                type="number"
                name="quantity_total"
                min="1"
                value={formData.quantity_total}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border rounded hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Ticket Type'}
            </button>
          </div>
        </form>
      )}

      {ticketTypes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (KES)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ticketTypes.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{ticket.name}</div>
                    {ticket.description && (
                      <div className="text-sm text-gray-500">{ticket.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(ticket.price / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.quantity_available} / {ticket.quantity_total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.quantity_sold || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(ticket)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    {(!ticket.quantity_sold || ticket.quantity_sold === 0) ? (
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-gray-400" title="Cannot delete ticket type with sales">
                        Delete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No ticket types added yet. Click "Add Ticket Type" to get started.
        </div>
      )}
    </div>
  );
};

export default TicketTypesManager;
