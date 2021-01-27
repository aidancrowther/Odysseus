# Odysseus - Network Tracking Tool

Description:

  Odysseus is a tool designed to automatically scan, and track servers on a home network, allowing an easier solution for loading webGUI's, as well as providing rudimentary server monitoring through RWHO. Screenshots can be found at: http://imgur.com/a/xHjbG
  
Status:
  
   This project is still under heavy development, the current distribution is mostly stable, however it is still case sensitive, and doesnt provide much error reporting
   
   Currently Supports:
   
   - Scanning a predefined range of ip's (ipStart -> ipEnd)
   - Scanning specified ports (80, 8081, etc...)
   - Define service names for specific ports
   - Thumbnails are added to links based on the service name (name the file `[servicename].png` and put it into `interface/images/`)
   - Thumbnails can be forced by server name (name the file `[servicename]-[hostname].png`), this will override the service image
   - Force/Omit ips, ignore unwanted devices, while forcing devices without host names to appear in the list
   - Automatically processes fqdn's based on user specified domain
   - Option to prevent host server from appearing in server list
   - Redirect from host:port to host:port/page
   - Basic server monitoring, simply install RWHOD on servers to monitor, and RWHO on host server to enable monitoring
   - Thumbnail uploading (follow thumbnail naming convention)
   
Roadmap:

   - [x] Fix host redirects
   - [x] Allow services to appear on multiple ports
   - [x] Block hosts by name in web GUI
   - [x] Improve error reporting
   - [ ] Auto Installer
   - [ ] Restrict access to monitoring/settings pages
   - [x] Specify thumbnail by server > service
   - [x] Add thumbnail upload
   - [X] Add UPS Monitoring
   
Requirements:

    - Basic use of Odysseus requires nodeJs for the webserver. All node modules are installed using npm install
    - Server monitoring requires the installation of RWHO on the server, but is not required for use of Odysseus
   
Install:

   - Download repository
     `git clone https://github.com/aidancrowther/Odysseus`
     
   - Navigate to Odysseus folder and install packages
     `npm install`
     
   - Run server (This should be done as an unprivileged user)
     `node server.js`
     
   - Additional options:
   
      - Set server port in `server.js` `const port = 80;`
      - Setup monitoring by installing RWHO on server `sudo apt-get install rwho`, and RWHOD on clients `sudo apt-get install rwhod`
      - Setup UPS monitoring by install Network UPS Tool (NUT) on host and NUT server on UPS hosts
      - Add thumbnails to the images folder to add more flair to links based on their service, name thumbnails `[service].png`
      
Usage:

   After getting your server running you can access the webpage by connecting to your hosts ip adress on the port you specified (default 80). The home page will show hosts that have been found on your network, and should be blank on first connection. Navigate to the settings page in order to setup the scanner, setting descriptions are as follows:
   
   - __IP address start__: define the starting point for the IP scanner `x.x.x.x`
   - __IP address end__: define the ending point for the scanner `x.x.x.x, start>end`
   - __Domain: specify your networks domain to automatically append/remove domain suffix as necessary
   - __Ignore host__: Specify whether or no you want the host to appear in the server list (If ignore host is enabled you cannot omit the host by hostname)
   - __Omit/Force host__: select from the list of located devices to block/unblock the device by its IP, if the device has no hostname it will automatically be blocked, selecting it will toggle its forced mode. Forced IPs will be given their IP as a hostname
   - __Omit by hostname__: Enter a hostname (CASE sensitive) to prevent from appearing on the server list
   - __Ports to scan__: Lists the ports that will be scanned, and their associated service (a few defaults have been included). Selecting one or more ports will remove it from the list on submit
   - __Add/Remove port__: enter a port in the form of `[port] - [service name]` to add/ovewrite it in the list.
   - __Hosts to redirect__: shows a list of existing host redirects, and where they redirect to. Selecting one or more redirects will remove it from the list on submit
   - __Set/Remove host redirect__: enter a redirect in the form `[hostname]:[port]/[page]` to add/overwrite the entry in the list
   - __Upload Thumbnail__: Select a thumbnail to upload to the server, following the naming convention of `[Service] - [Server].png` or `[Service].png`
   - __Remove Thumbnail__: Delete all selected thumbnails in the thumbnail selection box
   - Click the submit button below any of the forms to commit the changes to the configuration
   - Click update list to save the configuration to the server and scan your network
   
If you now navigate to the home page you should see a number of buttons with labels for your servers, and if configured images. Clicking these will automatically redirect you to their appropriate page.

The monitoring page allows you to keep track of your servers name, status, uptime, number of users, and cpu load averages. These stats are found using the ruptime command, requiring the rwho package on the host, and rwhod on each server to be monitored. If your host does not have this package monitoring will be disabled. Upon enabling monitoring, or navigating to the monitoring page once it has been enabled you will be presented with the server stats in a table format.

The UPS page allows you to configure and monitor NUT servers (including localhost). Set the address as `<UPS name>@<NUT server>`, specify nominal power in order to monitor UPS wattage (currently required while in Beta), and specify extra UPS results to monitor (currently does nothing). Please not that the UPS page is in Beta and as such is missing many ease of use/error catching features, use may be subject to bugs.
      
Problems:

   Please feel free to notify me of any issues you encounter, and I will fix them as soon as possible. I am open to any suggestions or requests, and will work to make the program as functional as possible
   
Thank You:

   Special Thanks to [eviltik/evilscan](https://github.com/eviltik/evilscan) for writing the port scanner that is the basis of this project, and to [emimontesdeoca/jordgubbe](https://github.com/emimontesdeoca/jordgubbe) and [AlessandroBerone/Pi-Home](https://github.com/AlessandroBerrone/Pi-Home) for the inspiration for this project!
    
