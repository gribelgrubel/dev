const server = require('http').createServer();
const io = require('socket.io')(server);
io.on('connection', client => {
  client.on('event', data => { /* … */ print("aaaaaa") });
  client.on('disconnect', () => { /* … */ });
});
//server.listen(3000);
server.listen(() => {
  console.log("Server is running.");
});