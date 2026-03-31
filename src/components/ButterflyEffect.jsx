import React, { useRef, useEffect } from "react";
import { Application, Assets, Sprite } from "pixi.js";
import styled from "styled-components";

const CanvasContainer = styled.div`
  position: relative;
  display: inline-block;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`;

const ButterflyEffect = ({
  iconSrc,
  particleSrc,
  width = 80,
  height = 80,
  butterflyInterval = 3000,
  butterflyCount = 5,
  butterflyPixelSize = 200, // Size in pixels (width and height will be this value)
}) => {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const iconRef = useRef(null);
  const butterfliesRef = useRef([]);
  const spawnTimeoutRef = useRef();
  const animationFrameRef = useRef();

  const createButterfly = (texture) => {
    if (!appRef.current || !iconRef.current) return;

    const app = appRef.current;
    const icon = iconRef.current;

    const butterfly = new Sprite(texture);

    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 20;
    const startX = icon.x + Math.cos(angle) * radius;
    const startY = icon.y + Math.sin(angle) * radius;

    butterfly.x = startX;
    butterfly.y = startY;
    butterfly.anchor.set(0.5);

    // Set exact pixel size (with slight random variation)
    const sizeVariation = 0.7 + Math.random() * 0.6; // 70% to 130% of base size
    const finalSize = butterflyPixelSize * sizeVariation;

    // Calculate scale based on texture's original size
    const originalWidth = texture.width;
    const originalHeight = texture.height;
    const scale = finalSize / Math.max(originalWidth, originalHeight);

    butterfly.scale.set(scale);
    butterfly.rotation = Math.random() * Math.PI * 2;

    const direction = Math.atan2(startY - icon.y, startX - icon.x);
    const speed = 2 + Math.random() * 3;
    const velocityX = Math.cos(direction) * speed;
    const velocityY = Math.sin(direction) * speed;
    const rotationSpeed = (Math.random() - 0.5) * 0.1;
    const maxLife = 120 + Math.random() * 60;

    app.stage.addChild(butterfly);

    butterfliesRef.current.push({
      sprite: butterfly,
      velocityX,
      velocityY,
      rotationSpeed,
      scale,
      life: 0,
      maxLife,
    });
  };

  const updateButterflies = () => {
    if (!appRef.current) return;

    const app = appRef.current;

    for (let i = butterfliesRef.current.length - 1; i >= 0; i--) {
      const butterfly = butterfliesRef.current[i];

      butterfly.sprite.x += butterfly.velocityX;
      butterfly.sprite.y += butterfly.velocityY;
      butterfly.sprite.y += Math.sin(Date.now() * 0.01 + i) * 0.5;
      butterfly.sprite.x += Math.cos(Date.now() * 0.015 + i) * 0.3;
      butterfly.sprite.rotation += butterfly.rotationSpeed;
      butterfly.life++;

      const lifeProgress = butterfly.life / butterfly.maxLife;
      butterfly.sprite.alpha = Math.max(0, 1 - lifeProgress);
      const scale = butterfly.scale * (1 - lifeProgress * 0.5);
      butterfly.sprite.scale.set(scale);

      const isOutOfBounds =
        butterfly.sprite.x < -100 ||
        butterfly.sprite.x > app.screen.width + 100 ||
        butterfly.sprite.y < -100 ||
        butterfly.sprite.y > app.screen.height + 100;

      if (butterfly.life >= butterfly.maxLife || isOutOfBounds) {
        app.stage.removeChild(butterfly.sprite);
        butterfly.sprite.destroy();
        butterfliesRef.current.splice(i, 1);
      }
    }
  };

  const startSpawningButterflies = (texture) => {
    const spawnButterfly = () => {
      if (butterfliesRef.current.length < butterflyCount && iconRef.current) {
        createButterfly(texture);
      }

      const variation = Math.random() * 2000 - 1000;
      const nextInterval = Math.max(1000, butterflyInterval + variation);
      spawnTimeoutRef.current = setTimeout(spawnButterfly, nextInterval);
    };

    spawnButterfly();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    const initApp = async () => {
      try {
        const app = new Application();
        await app.init({
          width: 300,
          height: 300,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
        });

        if (!isMounted || !containerRef.current) {
          app.destroy();
          return;
        }

        const canvasElement = app.canvas;
        canvasElement.style.width = "100%";
        canvasElement.style.height = "100%";
        canvasElement.style.display = "block";

        containerRef.current.appendChild(canvasElement);
        appRef.current = app;

        let iconTexture, butterflyTexture;

        try {
          [iconTexture, butterflyTexture] = await Promise.all([
            Assets.load(iconSrc),
            Assets.load(particleSrc),
          ]);

          // Log original sizes to help debug
          console.log(
            "Butterfly original size:",
            butterflyTexture.width,
            "x",
            butterflyTexture.height,
          );
        } catch (loadError) {
          console.error("Failed to load images:", loadError);
          const canvas = document.createElement("canvas");
          canvas.width = 80;
          canvas.height = 80;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#4CAF50";
          ctx.fillRect(0, 0, 80, 80);
          ctx.fillStyle = "white";
          ctx.font = "40px Arial";
          ctx.fillText("🦋", 20, 60);

          const fallbackTexture = await Assets.load(canvas.toDataURL());
          iconTexture = fallbackTexture;
          butterflyTexture = fallbackTexture;
        }

        if (!isMounted) return;

        const icon = new Sprite(iconTexture);
        icon.width = width;
        icon.height = height;
        icon.anchor.set(0.5);
        icon.x = app.screen.width / 2;
        icon.y = app.screen.height / 2;

        icon.eventMode = "static";
        icon.cursor = "pointer";
        icon.on("pointerover", () => {
          icon.scale.set(1.1);
        });
        icon.on("pointerout", () => {
          icon.scale.set(1);
        });

        app.stage.addChild(icon);
        iconRef.current = icon;

        startSpawningButterflies(butterflyTexture);

        const animate = () => {
          if (appRef.current) {
            updateButterflies();
          }
          animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error("Error initializing PixiJS:", error);
      }
    };

    initApp();

    return () => {
      isMounted = false;
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [iconSrc, particleSrc, width, height, butterflyInterval, butterflyCount]);

  return <CanvasContainer ref={containerRef} width={width} height={height} />;
};

export default ButterflyEffect;
