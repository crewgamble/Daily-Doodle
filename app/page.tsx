'use client'

import React, { useState, useEffect } from 'react';
import { useDraw } from '../hooks/useDraw';
import Papa from 'papaparse'; // For parsing CSV files

// Predefined set of colors for the palette
const colors = [
  '#FF5733', '#C70039', '#900C3F', '#581845',
  '#FFC300', '#DAF7A6', '#FFC0CB', '#808080',
  '#0000FF', '#008080', '#800080', '#FF0000',
  '#800000', '#808000', '#00FF00', '#00FFFF',
  '#008000', '#000080', '#FF00FF', '#000000', '#FFFFFF'
];



interface pageProps {}

const Page: React.FC<pageProps> = () => {
  const [promptWord, setPromptWord] = useState<string>('');
  const [color, setColor] = useState<string>('#000');
  const { canvasRef, onMouseDown, clear } = useDraw(drawLine);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(5);
  const [copySuccess, setCopySuccess] = useState('');

  const selectedStyle = {
    backgroundColor: 'darkgrey',
    color: 'white',
  };

  const handleColorClick = (color: string) => {
    setColor(color);
  };
  
  const copyDrawingToClipboard = async () => {
    if (!canvasRef.current) {
      console.error('No canvas found');
      return;
    }

    // Convert canvas to Blob
    canvasRef.current.toBlob((blob) => {
      if (blob) { // Check if blob is not null
        try {
          // Use the new Clipboard API to copy the image
          const data = [new ClipboardItem({ 'image/png': blob })];
          navigator.clipboard.write(data).then(() => {
            setCopySuccess('Drawing copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 3000); // Hide success message after a while
          }, (err) => {
            console.error('Failed to copy: ', err);
            setCopySuccess('Failed to copy drawing.');
          });
        } catch (err) {
          console.error('Error copying the drawing to the clipboard: ', err);
          setCopySuccess('Failed to copy drawing.');
        }
      } else {
        console.error('Blob is null, cannot copy to clipboard.');
        setCopySuccess('Failed to generate drawing for clipboard.');
      }
    }, 'image/png');
    
  };

  

  useEffect(() => {
    setIsClient(true);
    const fetchWords = async () => {
      const response = await fetch('/wordbank.csv');
      const csvRaw = await response.text();
  
      Papa.parse(csvRaw, {
        complete: (result: { data: any[][] }) => { // Assuming each row is an array of any
          // If you're sure every row[0] can be treated as a string, use 'as string[]'
          const words = result.data.map((row) => row[0] as string).filter((word): word is string => Boolean(word));
          const today = new Date();
          // Generate a seed based on the current date to ensure it changes daily but remains constant throughout the day
          const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
          // Use the seed to select a word. Here, a simple modulo operation ensures we pick a word based on the "daily" seed.
          const randomWord = words[seed % words.length];
          setPromptWord(`"${randomWord}"`);
        }
      });      
    };
  
    fetchWords();

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  
  

  

  function drawLine({ prevPoint, currentPoint, ctx }: any) {
    if (!prevPoint || !ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(prevPoint.x, prevPoint.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  function hexToRgba(hex: string): RGBA {
    let r = 0, g = 0, b = 0, a = 255; // Default to opaque if alpha isn't specified
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    } else if (hex.length === 9) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
      a = parseInt(hex[7] + hex[8], 16);
    }
    return { r, g, b, a };
  }
  

  function colorMatch(startColor: number[], fillColor: number[], tolerance: number = 12): boolean {
    return Math.abs(startColor[0] - fillColor[0]) <= tolerance &&
           Math.abs(startColor[1] - fillColor[1]) <= tolerance &&
           Math.abs(startColor[2] - fillColor[2]) <= tolerance &&
           Math.abs(startColor[3] - fillColor[3]) <= tolerance;
  }
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  };


  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    // Get image data URL in the desired format (e.g., 'image/png')
    const imageDataURL = canvas.toDataURL('image/png');
  
    // Create a temporary link to trigger download
    const tempLink = document.createElement('a');
    tempLink.href = imageDataURL;
    tempLink.download = 'canvas-image.png'; // Name the image file
  
    // Trigger the download
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
  };
  
  

  return (
    <div 
      className='w-screen h-screen bg-white flex justify-center items-center'
      style={{
        backgroundImage: 'url(/paintgamebg.png)', // This path assumes paintgamebg.png is directly inside the public folder
        backgroundSize: 'cover', // Cover the entire page
        backgroundPosition: 'center', // Center the background image
      }}
    >
      <div
        className="grid-container"
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gridTemplateColumns: '200px 1fr', // Fixed width for tools column
          gap: '10px',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // Optional: Adding a white overlay to make the text/tools more readable
        }}
      >
        {/* Prompt Word - Top Center */}
        <div
          style={{
            gridColumn: '1 / -1', // Stretch across all columns
            gridRow: '1',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            Today's Doodle: {promptWord}
          </span>
          
        </div>

        {/* Tools - Middle Left, centered and with fixed width */}
        <div
          style={{
            gridColumn: '1',
            gridRow: '2',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center', // Center tools vertically and horizontally
            justifyContent: 'center',
          }}
        >
         {/*{/* 
         <div style={{ width: '100%' }}> {/* Ensure ChromePicker is centered */} 
           {/*  <ChromePicker color={color} onChangeComplete={(colorResult) => setColor(colorResult.hex)} />
          {/* </div> */}
          
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 30px)', gap: '10px' }}>
        {colors.map((colorValue, index) => (
          <button
            key={index}
            style={{ backgroundColor: colorValue, width: '30px', height: '30px', border: color === colorValue ? '2px solid black' : '1px solid #ddd' }}
            onClick={() => handleColorClick(colorValue)}
          ></button>
        ))}
      </div>
          <button
            className={'p-2 rounded-md border border-black tool-button '} 
            onClick={clear} 
            style={{ width: '100%' }}>
              Clear canvas
          </button>
          <h1>Brush Size:</h1>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Canvas - Centered in the grid */}
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onClick={handleCanvasClick}
          width="750"
          height="750"
          style={{
            gridColumn: '2',
            gridRow: '2',
            justifySelf: 'center', // Center the canvas within its grid area
            border: '1px solid black',
          }}
        />

        {/* Save Image Button - Below Canvas */}
        <button
          onClick={saveImage}
          style={{
            gridColumn: '2',
            gridRow: '3',
            justifySelf: 'left', // Center button below the canvas
          }}
          className='p-2 rounded-md border border-black'
        >
          Save Image
        </button>
        <button onClick={copyDrawingToClipboard} 
        className='p-2 rounded-md border border-black'
        style={{
          gridColumn: '2',
          gridRow: '3',
          justifySelf: 'right'
        }}
        >
        Copy Drawing to Clipboard
      </button>
      {copySuccess && <p>{copySuccess}</p>}
      </div>
    </div>
  );
};

export default Page;