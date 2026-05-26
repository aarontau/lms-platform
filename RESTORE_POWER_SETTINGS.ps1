# Run this script in the morning to restore normal power settings
# Double-click or run in PowerShell terminal

powercfg /change standby-timeout-ac 30    # Sleep after 30 min on AC
powercfg /change hibernate-timeout-ac 60  # Hibernate after 60 min on AC

Write-Host "Power settings restored." -ForegroundColor Green
Write-Host "Sleep: 30 min on AC | Hibernate: 60 min on AC" -ForegroundColor Cyan
Read-Host "Press Enter to close"
