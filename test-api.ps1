$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = "sk-frgv4e5POKwMkFNn8vZB3WeYWidurZBp"
}

$body = @{
    amount = 10
    description = "test from computer"
} | ConvertTo-Json

Write-Host "Sending request to API..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://www.keseflow.com/api/quick-add" -Method POST -Headers $headers -Body $body -ContentType "application/json"
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Expense added successfully! Check your dashboard." -ForegroundColor Green
}
catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Server Response:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

Write-Host ""
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
