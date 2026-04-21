$listener = Get-NetTCPConnection -LocalPort 7500 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1

if ($listener -and $listener.OwningProcess) {
  Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 500
}

node server.js
