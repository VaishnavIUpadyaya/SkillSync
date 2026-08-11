const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');

let io = null;
const userSocketsMap = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://skill-sync-red.vercel.app'
      ],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication error: Token missing'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded.user || decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId).add(socket.id);

    socket.join(`user_${userId}`);

    socket.on('join_project_room', (projectId) => {
      if (projectId) {
        socket.join(`project_${projectId}`);
      }
    });

    socket.on('leave_project_room', (projectId) => {
      if (projectId) {
        socket.leave(`project_${projectId}`);
      }
    });

    socket.on('join_dm_room', ({ recipientId }) => {
      if (recipientId) {
        const room = [userId, recipientId].sort().join('_');
        socket.join(`dm_${room}`);
      }
    });

    socket.on('leave_dm_room', ({ recipientId }) => {
      if (recipientId) {
        const room = [userId, recipientId].sort().join('_');
        socket.leave(`dm_${room}`);
      }
    });

    socket.on('send_project_message', async ({ projectId, content }) => {
      try {
        if (!projectId || !content?.trim()) return;
        const msg = await Message.create({
          roomType: 'project',
          project: projectId,
          sender: userId,
          content: content.trim()
        });

        const populatedMsg = await Message.findById(msg._id).populate('sender', 'name profilePic role');
        io.to(`project_${projectId}`).emit('new_project_message', populatedMsg);
      } catch (err) {
        console.error('Socket send_project_message error:', err);
      }
    });

    socket.on('send_dm_message', async ({ recipientId, content }) => {
      try {
        if (!recipientId || !content?.trim()) return;
        const msg = await Message.create({
          roomType: 'dm',
          recipient: recipientId,
          sender: userId,
          content: content.trim()
        });

        const populatedMsg = await Message.findById(msg._id)
          .populate('sender', 'name profilePic role')
          .populate('recipient', 'name profilePic role');

        const room = [userId, recipientId].sort().join('_');
        io.to(`dm_${room}`).emit('new_dm_message', populatedMsg);

        sendRealtimeNotification(recipientId, {
          type: 'DIRECT_MESSAGE',
          title: `New message from ${populatedMsg.sender.name}`,
          message: content.length > 50 ? content.substring(0, 50) + '...' : content,
          sender: populatedMsg.sender,
          link: `/messages?user=${userId}`,
          createdAt: new Date()
        });
      } catch (err) {
        console.error('Socket send_dm_message error:', err);
      }
    });

    socket.on('disconnect', () => {
      if (userSocketsMap.has(userId)) {
        const sockets = userSocketsMap.get(userId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketsMap.delete(userId);
        }
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

function sendRealtimeNotification(recipientId, notificationData) {
  if (io) {
    io.to(`user_${recipientId}`).emit('new_notification', notificationData);
  }
}

module.exports = {
  initSocket,
  getIO,
  sendRealtimeNotification
};
