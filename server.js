const express = require('express')
const app = express()
app.use(require('body-parser').json())

const template = `
<!DOCTYPE html>
<html>
  <body>
	  <script>
      const source = new EventSource("/events/")
		  source.onmessage = function(e) {
		    document.body.innerHTML += e.data + "<br>"
		  }
    </script>
  </body>
  <h1>Server Messages</h1>
</html>`

app.get('/', (req, res) => res.send(template))

let clientId = 0
// map of connected clients
let clients = {} 

// sse: keep res open
app.get('/events/', (req, res) => {
  // don't close tcp underlying connexion
	req.socket.setTimeout(0)

  console.log(`<- client ${++clientId} connected`)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',  // sse headers
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  res.write('\n')
  res.write('retry: 3000\n\n')
  // keep connexion reference in clients map
  // for later use
  clients[clientId] = res
  // Delete the client from map when it disconnects
  req.on("close", () => {
    console.log(`disconnect ${clientId}`)
    delete clients[clientId]})
})

app.post('/message', (req, res) => {
  const message = req.body
  // broadcast message to each connected client
  serverEvent = `data: ${JSON.stringify(message)}\n\n`
  Object.keys(clients).forEach(clientId => clients[clientId].write(serverEvent))
  res.status(201).send('message posted')
})

app.listen(process.env.PORT || 3000)
