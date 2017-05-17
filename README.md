# Odysseus - Network Tracking Tool

Description:

  Odysseus is a tool designed to automatically scan, and track servers on a home network, allowing an easier solution for loading webGUI's, as well as providing rudimentary server monitoring through RWHO.
  
Status:
  
   This project is still under heavy development, the current distribution is mostly stable, however it is still case sensitive, and      doesnt provide much error reporting. 
   
   Currently Supports:
   
   - Scanning a predefined range of ip's (ipStart -> ipEnd)
   - Scanning specified ports (80, 8081, etc...)
   - Define service names for specific ports (currently done manually in ports.json)
   - Thumbnails are added to links based on the service name (name the file [servicename].png and put it into interface/images/)
   - Force/Omit ips, ignore unwanted devices, while forcing devices without host names to appear in the list
   - Automatically processes fqdn's based on user specified domain
   - Prevent host server from appearing in server list
   - Redirect from host:port to host:port/page (currently in development, manually add redirects to config.json for now)
   - Basic server monitoring, simply install RWHOD on servers to monitor, and RWHO on host server to enable monitoring
   
Roadmap:

   - [ ] Fix host redirects
   - [ ] Allow services to appear on multiple ports
   - [ ] Improve error reporting
   - [ ] Auto Installer
   
Install:

   - Download repository
     `git clone https://github.com/aidancrowther/Odysseus`
     
   - Navigate to Odysseus folder and install packages
     `npm install`
     
   - Run server (may require root permissions based on download location)
     `node server.js`
     
   - Additional options:
   
      - Set server port in `server.json` `const port = 80;`
      - Add host redirects in `config.json` in the form of `"redirect": {"Host": ["port", "/page"], ...}`
      - Setup monitoring by installing RWHO on server `sudo apt-get install rwho`, and RWHOD on clients `sudo apt-get install rwhod`
      - Add thumbnails to the images folder to add more flair to links based on their service, name thumbnails `[service].png`
      - Add custom port definitions in `ports.json` in the form `[servicename]: [port]`
      
Problems:

   Please feel free to notify me of any issues you encounter, and I will fix them as soon as possible.
   
Thank You:

    Special Thanks to [eviltik/evilscan] (https://github.com/eviltik/evilscan) for writing the port scanner that is the basis of this project.
    
