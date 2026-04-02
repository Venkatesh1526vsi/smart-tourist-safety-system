const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('./logger');
const { JWT_SECRET } = require('../config');

/**
 * WebSocket Server Configuration
 * Handles real-time communication for the tourist safety system
 */

class WebSocketServer {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRooms();
  }

  setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.user = user;
        socket.userId = user._id.toString();
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.userId}`, { 
        userId: socket.userId,
        socketId: socket.id 
      });

      // Join user-specific room
      socket.join(`user_${socket.userId}`);
      
      // Join role-based rooms
      if (socket.user.role === 'admin') {
        socket.join('admins');
        logger.info(`Admin connected: ${socket.userId}`);
      }

      // Handle location updates
      socket.on('location:update', (data) => {
        this.handleLocationUpdate(socket, data);
      });

      // Handle incident reports
      socket.on('incident:report', (data) => {
        this.handleIncidentReport(socket, data);
      });

      // Handle user status updates
      socket.on('user:status', (data) => {
        this.handleUserStatus(socket, data);
      });

      // Handle admin actions
      socket.on('admin:action', (data) => {
        this.handleAdminAction(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.userId}`, { 
          userId: socket.userId,
          socketId: socket.id 
        });
        this.handleUserDisconnect(socket);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        logger.error('Socket error:', error);
      });
    });
  }

  setupRooms() {
    // Create default rooms
    this.rooms = {
      incidents: 'incidents_room',
      locations: 'locations_room',
      notifications: 'notifications_room',
      admins: 'admins_room'
    };
  }

  // Handle location updates
  handleLocationUpdate(socket, data) {
    try {
      const { latitude, longitude, timestamp } = data;
      
      if (!latitude || !longitude) {
        socket.emit('error', { message: 'Invalid location data' });
        return;
      }

      const locationData = {
        userId: socket.userId,
        userName: socket.user.name,
        latitude,
        longitude,
        timestamp: timestamp || new Date(),
        socketId: socket.id
      };

      // Emit to location tracking room
      socket.to(this.rooms.locations).emit('location:updated', locationData);
      
      // Emit to admins
      socket.to('admins').emit('location:updated', locationData);
      
      // Confirm receipt to sender
      socket.emit('location:acknowledged', { 
        message: 'Location updated successfully',
        timestamp: new Date()
      });

      logger.info('Location updated', { 
        userId: socket.userId,
        latitude,
        longitude 
      });

    } catch (error) {
      logger.error('Location update error:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  }

  // Handle incident reports
  handleIncidentReport(socket, data) {
    try {
      const { type, description, latitude, longitude, severity = 'medium' } = data;
      
      if (!type) {
        socket.emit('error', { message: 'Incident type is required' });
        return;
      }

      const incidentData = {
        userId: socket.userId,
        reporter: socket.user.name,
        type,
        description: description || '',
        latitude: latitude || null,
        longitude: longitude || null,
        severity,
        timestamp: new Date(),
        status: 'reported'
      };

      // Emit to incidents room
      socket.to(this.rooms.incidents).emit('incident:reported', incidentData);
      
      // Emit to all admins
      socket.to('admins').emit('incident:reported', incidentData);
      
      // Emit to notifications room
      socket.to(this.rooms.notifications).emit('notification:new', {
        type: 'incident',
        title: `New ${type} incident reported`,
        message: description || `${type} incident by ${socket.user.name}`,
        severity,
        timestamp: new Date(),
        incident: incidentData
      });

      // Confirm to reporter
      socket.emit('incident:acknowledged', {
        message: 'Incident reported successfully',
        incidentId: incidentData._id || 'temp_' + Date.now(),
        timestamp: new Date()
      });

      logger.info('Incident reported', { 
        userId: socket.userId,
        type,
        severity 
      });

    } catch (error) {
      logger.error('Incident report error:', error);
      socket.emit('error', { message: 'Failed to report incident' });
    }
  }

  // Handle user status updates
  handleUserStatus(socket, data) {
    try {
      const { status, message } = data;
      
      const statusData = {
        userId: socket.userId,
        userName: socket.user.name,
        status: status || 'online',
        message: message || '',
        timestamp: new Date(),
        socketId: socket.id
      };

      // Emit to user status room
      socket.to('user_status').emit('user:status:updated', statusData);
      
      // Emit to admins
      socket.to('admins').emit('user:status:updated', statusData);
      
      socket.emit('status:acknowledged', {
        message: 'Status updated successfully',
        timestamp: new Date()
      });

      logger.info('User status updated', { 
        userId: socket.userId,
        status 
      });

    } catch (error) {
      logger.error('Status update error:', error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  }

  // Handle admin actions
  handleAdminAction(socket, data) {
    try {
      if (socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized: Admin access required' });
        return;
      }

      const { action, targetUserId, payload } = data;
      
      const actionData = {
        adminId: socket.userId,
        adminName: socket.user.name,
        action,
        targetUserId,
        payload,
        timestamp: new Date()
      };

      // Handle different admin actions
      switch(action) {
        case 'broadcast_emergency':
          // Broadcast emergency message to ALL connected users
          this.io.emit('emergency:alert', {
            ...payload,
            adminName: socket.user.name,
            timestamp: new Date()
          });
          break;
          
        case 'broadcast_notification':
          // Broadcast general notification to all users
          this.io.emit('notification:new', {
            ...payload,
            adminName: socket.user.name,
            timestamp: new Date()
          });
          break;
          
        case 'lock_down_area':
          // Send area lockdown notification to users in specific area
          // This would be based on user locations
          this.broadcastToArea(payload.area, 'area:lockdown', {
            ...payload,
            adminName: socket.user.name,
            timestamp: new Date()
          });
          break;
          
        default:
          // Emit admin action to relevant users
          if (targetUserId) {
            socket.to(`user_${targetUserId}`).emit('admin:action', actionData);
          }
          
          // Broadcast to all admins
          socket.to('admins').emit('admin:action:performed', actionData);
      }
      
      socket.emit('admin:action:acknowledged', {
        message: 'Admin action performed successfully',
        action,
        timestamp: new Date()
      });

      logger.info('Admin action performed', { 
        adminId: socket.userId,
        action,
        targetUserId 
      });

    } catch (error) {
      logger.error('Admin action error:', error);
      socket.emit('error', { message: 'Failed to perform admin action' });
    }
  }

  // Handle user disconnection
  handleUserDisconnect(socket) {
    try {
      // Notify others that user went offline
      const offlineData = {
        userId: socket.userId,
        userName: socket.user.name,
        status: 'offline',
        timestamp: new Date()
      };

      socket.to('user_status').emit('user:status:updated', offlineData);
      socket.to('admins').emit('user:status:updated', offlineData);

      logger.info('User went offline', { userId: socket.userId });

    } catch (error) {
      logger.error('Disconnect handler error:', error);
    }
  }

  // Utility methods for external use
  broadcastToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  broadcastToAdmins(event, data) {
    this.io.to('admins').emit(event, data);
  }

  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }
  
  // Broadcast to users in a specific geographic area
  broadcastToArea(areaCoordinates, event, data) {
    // This would typically involve checking user locations against area boundaries
    // For now, we'll broadcast to all users (in a real implementation, 
    // this would filter users based on their current location)
    this.io.emit(event, data);
  }

  getUserSocket(userId) {
    return Object.values(this.io.sockets.sockets).find(
      socket => socket.userId === userId
    );
  }

  getOnlineUsers() {
    const users = [];
    Object.values(this.io.sockets.sockets).forEach(socket => {
      if (socket.user) {
        users.push({
          userId: socket.userId,
          userName: socket.user.name,
          role: socket.user.role,
          socketId: socket.id,
          connectedAt: socket.connectedAt
        });
      }
    });
    return users;
  }
}

module.exports = WebSocketServer;