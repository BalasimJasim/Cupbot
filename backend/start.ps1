# Function to kill process by port
function Kill-ProcessByPort {
    param($port)
    
    try {
        # Get all processes using the port
        $processIds = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
        
        if ($processIds) {
            foreach ($processId in $processIds) {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Killing process $($process.Name) (ID: $processId) using port $port"
                    Stop-Process -Id $processId -Force
                }
            }
            # Wait for processes to fully terminate
            Start-Sleep -Seconds 2
        } else {
            Write-Host "No process found using port $port"
        }
    } catch {
        Write-Host "Error while trying to kill process: $_"
    }
}

# Function to check if port is in use
function Test-PortInUse {
    param($port)
    
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return [bool]$connection
}

# Main script
Write-Host "Starting server initialization..."

# Define the port
$port = 3001

# Check and kill any process using port 3001
Write-Host "Checking for processes using port $port..."
if (Test-PortInUse $port) {
    Write-Host "Port $port is in use. Attempting to free it..."
    Kill-ProcessByPort $port
} else {
    Write-Host "Port $port is free"
}

# Double-check port is free
$retryCount = 0
$maxRetries = 3
while (Test-PortInUse $port) {
    $retryCount++
    if ($retryCount -gt $maxRetries) {
        Write-Host "Failed to free port $port after $maxRetries attempts. Please try again later."
        exit 1
    }
    Write-Host "Port still in use, waiting 2 seconds... (Attempt $retryCount of $maxRetries)"
    Start-Sleep -Seconds 2
    Kill-ProcessByPort $port
}

Write-Host "Port $port is now available"
Write-Host "Starting development server..."

# Start the server using ts-node-dev directly
npx ts-node-dev --respawn src/server.ts 