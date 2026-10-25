# เซิร์ฟเวอร์ทดสอบในเครื่อง (ไม่ต้องติดตั้งอะไร) — เปิดเกมที่ http://localhost:8080/
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.png'='image/png'; '.jpg'='image/jpeg'; '.mp3'='audio/mpeg'; '.wav'='audio/wav'; '.json'='application/json' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add('http://localhost:8080/')
$l.Start()
Write-Host 'เกมพร้อมแล้วที่ http://localhost:8080/  (ปิดหน้าต่างนี้เพื่อหยุด)'
Start-Process 'http://localhost:8080/'
while ($l.IsListening) {
  $c = $l.GetContext()
  $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath); if ($p -eq '/') { $p = '/index.html' }
  $f = Join-Path $root ($p.TrimStart('/') -replace '/','\')
  if (Test-Path $f -PathType Leaf) {
    $b = [IO.File]::ReadAllBytes($f); $e = [IO.Path]::GetExtension($f).ToLower()
    $c.Response.ContentType = if ($mime[$e]) { $mime[$e] } else { 'application/octet-stream' }
    $c.Response.OutputStream.Write($b, 0, $b.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
