// BLOCK: HTTP Server Application

use std::net::{TcpListener, TcpStream};
use std::io::{Read, Write};
use std::thread;

// SUBBLOCK1: Server Configuration

struct ServerConfig {
    host: String,
    port: u16,
    max_connections: usize,
}

impl ServerConfig {
    fn new(host: &str, port: u16) -> Self {
        ServerConfig {
            host: host.to_string(),
            port,
            max_connections: 100,
        }
    }
    
    fn address(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

// SUBBLOCK1: HTTP Server Implementation

pub struct HttpServer {
    config: ServerConfig,
}

impl HttpServer {
    // SUBBLOCK2: Server Initialization
    
    pub fn new(host: &str, port: u16) -> Self {
        HttpServer {
            config: ServerConfig::new(host, port),
        }
    }
    
    // SUBBLOCK2: Start Server
    
    pub fn start(&self) -> std::io::Result<()> {
        // SUBBLOCK3: Bind to Port
        let listener = TcpListener::bind(self.config.address())?;
        println!("Server listening on {}", self.config.address());
        
        // SUBBLOCK3: Accept Connections
        for stream in listener.incoming() {
            match stream {
                Ok(stream) => {
                    // SUBBLOCK4: Spawn Handler Thread
                    thread::spawn(|| {
                        Self::handle_connection(stream);
                    });
                }
                Err(e) => {
                    eprintln!("Connection failed: {}", e);
                }
            }
        }
        
        Ok(())
    }
    
    // SUBBLOCK2: Connection Handler
    
    fn handle_connection(mut stream: TcpStream) {
        // SUBBLOCK3: Read Request
        let mut buffer = [0; 1024];
        match stream.read(&mut buffer) {
            Ok(size) => {
                let request = String::from_utf8_lossy(&buffer[..size]);
                println!("Request: {}", request);
                
                // SUBBLOCK3: Parse Request
                let response = Self::process_request(&request);
                
                // SUBBLOCK3: Send Response
                if let Err(e) = stream.write_all(response.as_bytes()) {
                    eprintln!("Failed to send response: {}", e);
                }
            }
            Err(e) => {
                eprintln!("Failed to read request: {}", e);
            }
        }
    }
    
    // SUBBLOCK2: Request Processing
    
    fn process_request(request: &str) -> String {
        // SUBBLOCK3: Parse HTTP Method and Path
        let lines: Vec<&str> = request.lines().collect();
        if lines.is_empty() {
            return Self::error_response(400, "Bad Request");
        }
        
        let parts: Vec<&str> = lines[0].split_whitespace().collect();
        if parts.len() < 2 {
            return Self::error_response(400, "Invalid Request");
        }
        
        let method = parts[0];
        let path = parts[1];
        
        // SUBBLOCK3: Route Request
        match (method, path) {
            ("GET", "/") => Self::success_response("Welcome to Rust HTTP Server"),
            ("GET", "/health") => Self::success_response("OK"),
            ("GET", path) if path.starts_with("/api/") => {
                Self::json_response(r#"{"status": "success"}"#)
            }
            _ => Self::error_response(404, "Not Found"),
        }
    }
    
    // SUBBLOCK2: Response Builders
    
    fn success_response(body: &str) -> String {
        format!(
            "HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{}",
            body.len(),
            body
        )
    }
    
    fn json_response(body: &str) -> String {
        format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
            body.len(),
            body
        )
    }
    
    fn error_response(code: u16, message: &str) -> String {
        format!(
            "HTTP/1.1 {} {}\r\nContent-Length: {}\r\n\r\n{}",
            code,
            message,
            message.len(),
            message
        )
    }
}

// BLOCK: Main Entry Point

fn main() {
    // SUBBLOCK1: Initialize Server
    let server = HttpServer::new("127.0.0.1", 8080);
    
    // SUBBLOCK1: Start Listening
    match server.start() {
        Ok(_) => println!("Server stopped"),
        Err(e) => eprintln!("Server error: {}", e),
    }
}
