#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Install Python dependencies
pip install -r requirements.txt

# Start the main web server (run.py) in the background
echo "Starting main server..."
python run.py &

# Start the agent script (run_agent.py) in the background
echo "Starting agent..."
python run_agent.py &

# Wait for all background processes to finish
wait 