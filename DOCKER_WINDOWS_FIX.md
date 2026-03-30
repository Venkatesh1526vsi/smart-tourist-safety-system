# Docker Setup Troubleshooting for Windows

## ❌ Error: "Cannot connect to Docker daemon"

This means **Docker Desktop is not running**.

---

## ✅ Fix: Start Docker Desktop

### Option 1: GUI (Easiest)
1. Click **Windows Start Menu**
2. Search for **"Docker Desktop"**
3. Click to launch
4. Wait for the whale icon to appear in the taskbar
5. Wait for "Docker is running" message (1-2 minutes)

### Option 2: PowerShell (Manual)
```powershell
# Start Docker Desktop via PowerShell
& "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Wait for it to be ready (check taskbar)
# Then try docker-compose again
```

### Option 3: Check Status
```powershell
# Verify Docker is running
docker ps

# Should return empty list or running containers
# If it says "cannot connect", Docker Desktop isn't running yet
```

---

## ⏳ Wait for Docker to Be Ready

After starting Docker Desktop:
- **Whale icon appears** in taskbar
- **Wait 1-2 minutes** for it to fully start
- **Then try** `docker compose up`

You'll see the whale icon change from "starting" to "running".

---

## 🚀 Once Docker Desktop is Running

```powershell
cd docker
docker compose up
```

No more errors!

---

## 💡 Other Tips

### If Still Getting Errors
```powershell
# Check Docker status
docker --version
docker ps

# If still failing, restart Docker
# Right-click Docker icon → Quit
# Wait 10 seconds
# Restart Docker Desktop
```

### If Docker Desktop Won't Start
1. Check system requirements (Windows 10 Pro/Enterprise or Windows 11)
2. Check WSL2 is installed: `wsl --list --verbose`
3. Restart your computer
4. Reinstall Docker Desktop if needed

---

## ✅ You're Good When You See This:

```
[+] Running 1/4
 ⠙ mongo Pulling                                                    
 ⠙ backend Pulling                                                  
 ⠙ ai Pulling                                                       
 ⠙ frontend Pulling                                                 

[+] Running 4/4
 ✔ mongo Running
 ✔ backend Running
 ✔ ai Running
 ✔ frontend Running
```

Then access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- AI: http://localhost:8000

---

## 🔧 Still Not Working?

Try this clean restart:

```powershell
# Stop Docker
docker compose down

# Clear everything
docker system prune -a -f

# Restart Docker Desktop (via GUI or PowerShell)
# Then try again
docker compose up
```

---

**Next Step**: Make sure Docker Desktop is running, then run `docker compose up`
