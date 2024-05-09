// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('fs')

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const userDataPath = app.getPath('userData')

ipcMain.on('readFile', (event, fileName) => {
  const filePath = path.join(userDataPath, fileName)
  console.log(filePath)
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    event.sender.send('readComplete', content)
  } catch (err) {
    new Error(err)
    event.sender.send('readComplete', '')
  }
})

ipcMain.on('writeFile', (event, fileName, txt, isAppend = false) => {
  const type = isAppend ? 'appendFileSync' : 'writeFileSync'
  const filePath = path.join(userDataPath, fileName)
  try {
    fs[type](filePath, JSON.stringify(txt), 'utf8')
  } catch (err) {
    new Error(err)
  }
  event.sender.send('writeComplete', null)
})