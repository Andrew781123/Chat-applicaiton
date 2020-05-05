let onlineUsers = [];

function addUser(socketId) {
    const onlineUser = { socketId }
    onlineUsers.push(onlineUser);
}

function getUserById(socketId) {
    return onlineUsers.find(onlineUser => onlineUser.socketId === socketId);
}

module.exports = {
    addUser,
    getUserById
};