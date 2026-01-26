
$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = "sk-frgv4e5POKwMkFNn8vZB3WeYWidurZBp"
}

Write-Host "Getting Quick Stats..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://www.kesefly.co.il/api/quick-stats" -Method GET -Headers $headers -ContentType "application/json"
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Server Response:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}
