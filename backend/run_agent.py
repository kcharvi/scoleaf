import asyncio
from app.livekit_agent.agent import entrypoint
from livekit.agents import WorkerOptions, cli

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint)) 