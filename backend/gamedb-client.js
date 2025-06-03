const net = require('node:net');

class GameDBClient {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.connected = false;
    this.pendingRequests = new Map();
    this.requestIdCounter = 1;
    this.buffer = Buffer.alloc(0);
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      
      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      this.socket.connect(this.port, this.host, () => {
        clearTimeout(connectionTimeout);
        this.connected = true;
        console.log(`Connected to gamedbd at ${this.host}:${this.port}`);
        resolve();
      });
      
      this.socket.on('data', (data) => {
        // Append new data to existing buffer
        this.buffer = Buffer.concat([this.buffer, data]);
        
        // Process complete packets
        this.processBuffer();
      });
      
      this.socket.on('close', () => {
        console.log('Connection to gamedbd closed');
        this.connected = false;
      });
      
      this.socket.on('error', (err) => {
        console.error('gamedbd connection error:', err);
        if (!this.connected) {
          clearTimeout(connectionTimeout);
          reject(err);
        }
      });
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.connected = false;
    }
  }
  
  processBuffer() {
    // This is a simplified packet processing logic
    // You'll need to adjust based on your actual protocol
    
    while (this.buffer.length >= 10) { // Minimum packet size for a response
      const responseType = this.buffer.readUInt16LE(0);
      const requestId = this.buffer.readUInt32LE(2);
      const retcode = this.buffer.readInt32LE(6);
      
      // Determine packet size based on response type and retcode
      let packetSize = 10; // Header size
      
      if (responseType === 4002 && retcode === 0) { // GetRole success
        // For a successful GetRole response, we need to determine the size
        // This is a simplified example - adjust based on your actual protocol
        
        // For this example, let's assume a fixed size for the Role structure
        // In a real implementation, you would determine the size dynamically
        packetSize = 200; // Example size
        
        if (this.buffer.length < packetSize) {
          // Not enough data yet
          return;
        }
      }
      
      // Extract the complete packet
      const packetData = this.buffer.slice(0, packetSize);
      
      // Remove the processed packet from the buffer
      this.buffer = this.buffer.slice(packetSize);
      
      // Handle the response
      this.handleResponse(packetData);
    }
  }
  
  handleResponse(data) {
    const responseType = data.readUInt16LE(0);
    const requestId = data.readUInt32LE(2);
    const retcode = data.readInt32LE(6);
    
    // Get the pending request
    const pendingRequest = this.pendingRequests.get(requestId);
    if (!pendingRequest) {
      console.warn(`Received response for unknown request ID: ${requestId}`);
      return;
    }
    
    // Clear the timeout and remove from pending requests
    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(requestId);
    
    // Process based on response type
    if (responseType === 4002) { // GetRole response
      if (retcode === 0) {
        // Success - parse the Role structure
        const roleData = this.parseRoleData(data, 10);
        pendingRequest.resolve(roleData);
      } else {
        // Error
        pendingRequest.reject(new Error(`GetRole failed with code: ${retcode}`));
      }
    } else {
      pendingRequest.reject(new Error(`Unknown response type: ${responseType}`));
    }
  }
  
  parseRoleData(data, offset) {
    // This is a simplified example - adjust based on your actual Role structure
    const roleData = {
      id: data.readUInt32LE(offset),
    };
    offset += 4;
    
    // Parse other fields based on your Role structure
    // Example fields (adjust based on your actual structure)
    roleData.userId = data.readUInt32LE(offset);
    offset += 4;
    
    roleData.level = data.readUInt32LE(offset);
    offset += 4;
    
    roleData.exp = data.readUInt32LE(offset);
    offset += 4;
    
    roleData.money = data.readUInt32LE(offset);
    offset += 4;
    
    // Parse name (assuming fixed-length string)
    const nameBuffer = data.slice(offset, offset + 32);
    roleData.name = this.parseNullTerminatedString(nameBuffer);
    
    return roleData;
  }
  
  parseNullTerminatedString(buffer) {
    let end = 0;
    while (end < buffer.length && buffer[end] !== 0) {
      end++;
    }
    return buffer.slice(0, end).toString('utf8');
  }
  
  /**
   * Get role details by ID
   * @param {number} roleId - The ID of the role to retrieve
   * @returns {Promise<Object>} - A promise that resolves to the role data
   */
  getRole(roleId) {
    if (!this.connected) {
      return Promise.reject(new Error('Not connected to gamedbd'));
    }
    
    return new Promise((resolve, reject) => {
      const requestId = this.requestIdCounter++;
      
      // Create request buffer for GetRole RPC (RPC_GETROLE = 4002)
      const buffer = Buffer.alloc(10); // 2 (type) + 4 (requestId) + 4 (roleId)
      
      // RPC type for GetRole (4002)
      buffer.writeUInt16LE(4002, 0);
      
      // Request ID for tracking the response
      buffer.writeUInt32LE(requestId, 2);
      
      // Role ID
      buffer.writeUInt32LE(roleId, 6);
      
      console.log(`Sending GetRole request for role ID ${roleId}`);
      
      // Store the pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timed out'));
        }, 10000) // 10 second timeout
      });
      
      // Send the request
      this.socket.write(buffer);
    });
  }
}

module.exports = GameDBClient;