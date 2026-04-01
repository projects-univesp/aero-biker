import { openModal, closeModal } from "./modal.js";
import { APP_CONFIG } from './config.js';

export default class HandleData {
  constructor(event, config, itemId = null) {
    this.event = event;
    this.config = config;
    this.itemId = itemId;
  }

  async dialUp(method, path, id = '', payload = null) {
    const url = id ? `/api/${path}/${id}` : `/api/${path}`;
    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (payload) {
      options.body = JSON.stringify(payload);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na requisição.');
      }

      return method === 'DELETE' ? true : await response.json();

    } catch (error) {
      console.error(`[HandleData DialUp] Erro no ${method}:`, error);
      alert(`Erro: ${error.message}`);
      throw error;
    }
  }

  // Helper to build the payload fields
  _buildPayload() {
    const payload = {};
    
    if (this.config.fields) {
      for (const [apiKey, elementId] of Object.entries(this.config.fields)) {
        const el = document.getElementById(elementId);
        if (el) payload[apiKey] = el.value;
      }
    }
    if (this.config.checkboxes) {
      for (const [apiKey, elementId] of Object.entries(this.config.checkboxes)) {
        const el = document.getElementById(elementId);
        if (el) payload[apiKey] = el.checked;
      }
    }
    return payload;
  }

  // (GET)
  async get() {
    if (this.config.id && document.getElementById(this.config.id)) {
      document.getElementById(this.config.id).value = '';
    }
    if (this.config.fields) {
      Object.values(this.config.fields).forEach(input => {
        const el = document.getElementById(input);
        if (el) el.value = '';
      });
    }

    if (this.itemId) {
      if (this.config.id) document.getElementById(this.config.id).value = this.itemId;

      try {
        const result = await this.dialUp('GET', this.config.path, this.itemId);
        const data = result.data;

        if (this.config.fields) {
          for (const [dbKey, htmlId] of Object.entries(this.config.fields)) {
            if (data[dbKey] !== undefined) document.getElementById(htmlId).value = data[dbKey];
          }
        }
        if (this.config.checkboxes) {
          for (const [dbKey, htmlId] of Object.entries(this.config.checkboxes)) {
            if (data[dbKey] !== undefined) document.getElementById(htmlId).checked = data[dbKey];
          }
        }
      } catch (error) {
        return; 
      }
    }

    if (this.config.modalId && typeof openModal === 'function') {
      openModal(this.config.modalId);
    }
  }

  // (POST)
  async create() {
    const payload = this._buildPayload();
    try {
      await this.dialUp('POST', this.config.path, '', payload);
      this._onSuccess();
    } catch (error) {}
  }

  // (PATCH)
  async update(id) {
    const payload = this._buildPayload();
    try {
      await this.dialUp('PATCH', this.config.path, id, payload);
      this._onSuccess();
    } catch (error) {}
  }

  submit() {
    if (this.event) this.event.preventDefault();
    
    const idElement = document.getElementById(this.config.id);
    const id = idElement ? idElement.value : '';

    if (id) {
      this.update(id);
    } else {
      this.create();
    }
  }

  // (DELETE)
  async delete() {
    try {
      await this.dialUp('DELETE', this.config.path, this.itemId);
      window.location.reload();
    } catch (error) {}
  }
  // Helper on success case
  _onSuccess() {
    if (this.config.modalId && typeof closeModal === 'function') {
      closeModal(this.config.modalId);
    }
    window.location.reload();
  }
}

// Quick functions
window.handleOpen = (id, config) => {
  new HandleData(null, config, id).get();
};

window.handleSubmit = (event, config) => {
  new HandleData(event, config).submit();
};

window.handleDelete = (id, path) => {
  new HandleData(null, { path: path }, id).delete();
};