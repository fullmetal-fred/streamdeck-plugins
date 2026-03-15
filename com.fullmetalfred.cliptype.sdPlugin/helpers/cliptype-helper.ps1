<#
.SYNOPSIS
    ClipType Helper — Local HTTP server that simulates keystrokes on Windows.

.DESCRIPTION
    Listens on http://127.0.0.1:23456/ for POST requests from the
    ClipType Stream Deck plugin and types the received text character
    by character using .NET's SendKeys.

    This helper runs as a background process. The plugin starts it
    automatically, or you can run it manually.

.NOTES
    Author: fullmetalfred
    Requires: Windows PowerShell 5.1+ or PowerShell 7+
#>

Add-Type -AssemblyName System.Windows.Forms

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:23456/")

try {
    $listener.Start()
    Write-Host "ClipType helper listening on http://127.0.0.1:23456/"
} catch {
    Write-Error "Failed to start listener. Is another instance running? $_"
    exit 1
}

# Map of characters that need escaping for SendKeys
function Escape-SendKeysChar([char]$c) {
    switch ($c) {
        '+' { return '{+}' }
        '^' { return '{^}' }
        '%' { return '{%}' }
        '~' { return '{~}' }
        '(' { return '{(}' }
        ')' { return '{)}' }
        '{' { return '{{}' }
        '}' { return '{}}' }
        default { return [string]$c }
    }
}

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    if ($req.HttpMethod -eq "POST" -and $req.Url.AbsolutePath -eq "/type") {
        $reader = [System.IO.StreamReader]::new($req.InputStream)
        $body = $reader.ReadToEnd()
        $reader.Close()

        try {
            $data = $body | ConvertFrom-Json
            $text = $data.text
            $charDelay = if ($data.charDelayMs) { [int]$data.charDelayMs } else { 20 }
            $lineDelay = if ($data.lineDelayMs) { [int]$data.lineDelayMs } else { 50 }

            # Small pause to let the user switch to target window
            Start-Sleep -Milliseconds 500

            foreach ($char in $text.ToCharArray()) {
                if ($char -eq "`n") {
                    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
                    Start-Sleep -Milliseconds $lineDelay
                } elseif ($char -eq "`r") {
                    # Skip carriage return (handled with newline)
                    continue
                } elseif ($char -eq "`t") {
                    [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
                    Start-Sleep -Milliseconds $charDelay
                } else {
                    $escaped = Escape-SendKeysChar $char
                    [System.Windows.Forms.SendKeys]::SendWait($escaped)
                    Start-Sleep -Milliseconds $charDelay
                }
            }

            $resBody = '{"status":"ok"}'
            $resBytes = [System.Text.Encoding]::UTF8.GetBytes($resBody)
            $res.StatusCode = 200
            $res.ContentType = "application/json"
            $res.OutputStream.Write($resBytes, 0, $resBytes.Length)
        } catch {
            $errBody = "{`"status`":`"error`",`"message`":`"$($_.Exception.Message)`"}"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errBody)
            $res.StatusCode = 500
            $res.ContentType = "application/json"
            $res.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
    } elseif ($req.HttpMethod -eq "GET" -and $req.Url.AbsolutePath -eq "/health") {
        $okBody = '{"status":"ok"}'
        $okBytes = [System.Text.Encoding]::UTF8.GetBytes($okBody)
        $res.StatusCode = 200
        $res.ContentType = "application/json"
        $res.OutputStream.Write($okBytes, 0, $okBytes.Length)
    } elseif ($req.HttpMethod -eq "POST" -and $req.Url.AbsolutePath -eq "/stop") {
        $byeBody = '{"status":"stopping"}'
        $byeBytes = [System.Text.Encoding]::UTF8.GetBytes($byeBody)
        $res.StatusCode = 200
        $res.ContentType = "application/json"
        $res.OutputStream.Write($byeBytes, 0, $byeBytes.Length)
        $res.OutputStream.Close()
        $listener.Stop()
        break
    } else {
        $res.StatusCode = 404
    }

    $res.OutputStream.Close()
}

Write-Host "ClipType helper stopped."
