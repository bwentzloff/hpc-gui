const { app, BrowserWindow, ipcMain, safeStorage } = require('electron')
const Store = require('electron-store');
const path = require('path')
const { exec } = require("child_process");
var SSH = require('simple-ssh');

var output = '';
const store = new Store()

const createWindow = () => {
    const win = new BrowserWindow({
      width: 1600,
      height: 1200,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        devTools: true,
        preload: path.join(__dirname, 'preload.js'),
      }
    })

    ipcMain.on('toMain', (event, creds) => {
        console.log(creds)
        // Just set each one individually. Then you'll be pretty much done
        store.set('creds', {
          'host': creds.endpoint,
          'user': creds.user,
          'pass': creds.pass
        });
        console.log('initial load stored')
        console.log(store.get('creds'));
        if (creds.action == 'getCreds') {
          
          const creds = store.get('creds');
          console.log('stored creds')
          console.log(creds)
          const webContents = event.sender
          const win = BrowserWindow.fromWebContents(webContents)
          win.webContents.send('sendCreds',creds);
        } else if (creds.action == "findSlurm") {
          var ssh = new SSH({
            host: creds.endpoint,
            user: creds.username,
            pass: creds.password
          });
          console.log('executing')
          console.log("find . -name slurm-"+creds.jobId+".out -exec tail {} \\;")
          ssh.exec("find . -name slurm-"+creds.jobId+".out -exec tail {} \\;", {
            out: function(stdout) {
                console.log('received output')
                output = stdout
                console.log(output)
                const webContents = event.sender
                const win = BrowserWindow.fromWebContents(webContents)
                win.webContents.send("fromMainShowTail", output);
            },
            err: function(stderr) {
              console.log(stderr)
            }
          }).start();
        } else if (creds.action == "findSlurmWithLocation") {
          var ssh = new SSH({
            host: creds.endpoint,
            user: creds.username,
            pass: creds.password
          });
          console.log('executing')
          ssh.exec("tail "+creds.location, {
            out: function(stdout) {
                console.log('received output')
                output = stdout
                console.log(output)
                const webContents = event.sender
                const win = BrowserWindow.fromWebContents(webContents)
                win.webContents.send("fromMainShowTail", output);
            }
          }).start();
        } else if (creds.action == "findLocation") {
          var ssh = new SSH({
            host: creds.endpoint,
            user: creds.username,
            pass: creds.password
          });
          console.log('executing')
          console.log("find . -name slurm-"+creds.jobId+".out -print -quit")
          ssh.exec("find . -name slurm-"+creds.jobId+".out -print -quit", {
            out: function(stdout) {
                console.log('received output')
                output = stdout
                console.log(output)
                const webContents = event.sender
                const win = BrowserWindow.fromWebContents(webContents)
                win.webContents.send("fromMainShowLocation", output);
            },
            err: function(stderr) {
              console.log(stderr)
            }
          }).start();
        } else {
          var ssh = new SSH({
            host: creds.endpoint,
            user: creds.username,
            pass: creds.password
          });
          my_jobs = []
          output = ''
          ssh.exec("printf '%s\n' $(squeue -u bwntzlff)", {
            out: function(stdout) {
                output = output + stdout
                var my_jobs = output.split('\n')
                const webContents = event.sender
                const win = BrowserWindow.fromWebContents(webContents)
                console.log('----- jobs -----')
                console.log(my_jobs)
                win.webContents.send("fromMain", my_jobs);
            }
          }).start();
        }
      })
  
    win.loadFile('index.html')
    //win.webContents.openDevTools()
  }

  app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // for windows and linux
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

 