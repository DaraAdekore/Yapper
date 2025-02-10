import React, { useEffect, useState } from "react";
import "../../styles/BlipsAnimation.css";

export const BlipsAnimation = () => {
    const [blips, setBlips] = useState<Array<{ id: number; x: number; y: number }>>([]);
    useEffect(() => {
        const interval = setInterval(() => {
            const id = Date.now();
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;

            setBlips((prev) => [...prev, { id, x, y }]);

            setTimeout(() => {
                setBlips((prev) => prev.filter((blip) => blip.id !== id));
            }, 2000);
        }, 1000);

        return () => clearInterval(interval);
    }, []);
    return <div className="blips-container">
        {blips.map((blip) => (
            <div key={blip.id} className="blip" style={{ left: `${blip.x}px`, top: `${blip.y}px` }}></div>
        ))}
    </div>;
}