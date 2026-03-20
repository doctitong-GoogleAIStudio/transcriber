import React, { useState, useEffect } from 'react';
import { TrashIcon, CheckIcon } from './Icons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SharingSettings = ({ onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    messenger_username: '',
    facebook_profile_url: '',
    mobile_number: '',
    is_favorite: false,
    preferred_share_format: 'plain_text'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API}/messenger-contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await axios.put(`${API}/messenger-contacts/${editingId}`, formData);
      } else {
        await axios.post(`${API}/messenger-contacts`, formData);
      }
      
      fetchContacts();
      resetForm();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Error saving contact. Please try again.');
    }
  };

  const handleEdit = (contact) => {
    setFormData({
      display_name: contact.display_name,
      messenger_username: contact.messenger_username || '',
      facebook_profile_url: contact.facebook_profile_url || '',
      mobile_number: contact.mobile_number || '',
      is_favorite: contact.is_favorite,
      preferred_share_format: contact.preferred_share_format
    });
    setEditingId(contact.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await axios.delete(`${API}/messenger-contacts/${id}`);
        fetchContacts();
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  const handleToggleFavorite = async (contact) => {
    try {
      await axios.put(`${API}/messenger-contacts/${contact.id}`, {
        is_favorite: !contact.is_favorite
      });
      fetchContacts();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      display_name: '',
      messenger_username: '',
      facebook_profile_url: '',
      mobile_number: '',
      is_favorite: false,
      preferred_share_format: 'plain_text'
    });
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          Sharing Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        )}
      </div>

      {/* Add/Edit Contact Form */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="mb-6 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
        >
          + Add New Contact
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Contact' : 'Add New Contact'}
          </h3>

          <div>
            <Label htmlFor="display_name">Display Name *</Label>
            <Input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
              placeholder="Dr. Juan Dela Cruz"
            />
          </div>

          <div>
            <Label htmlFor="messenger_username">Messenger Username</Label>
            <Input
              id="messenger_username"
              type="text"
              value={formData.messenger_username}
              onChange={(e) => setFormData({ ...formData, messenger_username: e.target.value })}
              placeholder="juan.delacruz"
            />
            <p className="text-xs text-gray-500 mt-1">Used for direct messaging</p>
          </div>

          <div>
            <Label htmlFor="facebook_profile_url">Facebook Profile URL</Label>
            <Input
              id="facebook_profile_url"
              type="url"
              value={formData.facebook_profile_url}
              onChange={(e) => setFormData({ ...formData, facebook_profile_url: e.target.value })}
              placeholder="https://facebook.com/juan.delacruz"
            />
          </div>

          <div>
            <Label htmlFor="mobile_number">Mobile Number</Label>
            <Input
              id="mobile_number"
              type="tel"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              placeholder="+63 912 345 6789"
            />
          </div>

          <div>
            <Label htmlFor="preferred_format">Preferred Share Format</Label>
            <Select
              value={formData.preferred_share_format}
              onValueChange={(value) => setFormData({ ...formData, preferred_share_format: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain_text">Plain Text</SelectItem>
                <SelectItem value="txt">TXT File</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_favorite"
              checked={formData.is_favorite}
              onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked })}
            />
            <label htmlFor="is_favorite" className="text-sm cursor-pointer">
              Mark as Favorite ⭐
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              {saved ? <CheckIcon className="h-5 w-5" /> : null}
              <span>{saved ? 'Saved!' : editingId ? 'Update' : 'Add'} Contact</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-3">
          Contacts ({contacts.length})
        </h3>
        
        {contacts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            No contacts yet. Add your first contact to start sharing.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {contact.display_name}
                    </h4>
                    <button
                      onClick={() => handleToggleFavorite(contact)}
                      className="text-xl hover:scale-110 transition"
                    >
                      {contact.is_favorite ? '⭐' : '☆'}
                    </button>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                      title="Edit"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {contact.messenger_username && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{contact.messenger_username}
                  </p>
                )}
                
                {contact.mobile_number && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    📱 {contact.mobile_number}
                  </p>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  Format: <span className="font-semibold">{contact.preferred_share_format}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
