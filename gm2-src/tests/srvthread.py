import threading,http.server,functools,socketserver
def start(d,port=8778):
  h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=d)
  h.log_message=lambda *a:None
  socketserver.TCPServer.allow_reuse_address=True
  s=socketserver.ThreadingTCPServer(('127.0.0.1',port),h);threading.Thread(target=s.serve_forever,daemon=True).start();return s
