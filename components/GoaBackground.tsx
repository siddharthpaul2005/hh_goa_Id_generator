export default function GoaBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-end justify-between">
      
      {/* Left Palm Tree */}
      <div className="absolute top-0 left-0 w-[150px] md:w-[450px] h-[100vh] origin-top-left pointer-events-none opacity-50 md:opacity-100">
        <svg viewBox="0 0 400 800" className="w-full h-full" preserveAspectRatio="xMinYMax slice">
          {/* Trunk */}
          <path d="M 0 800 Q 150 500 200 200 L 230 200 Q 180 500 50 800 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="6" />
          {/* Trunk segments */}
          <path d="M 50 780 Q 90 770 110 785" fill="none" stroke="#000000" strokeWidth="6" />
          <path d="M 80 650 Q 130 630 145 660" fill="none" stroke="#000000" strokeWidth="6" />
          <path d="M 125 500 Q 170 480 180 510" fill="none" stroke="#000000" strokeWidth="6" />
          <path d="M 160 350 Q 190 330 205 360" fill="none" stroke="#000000" strokeWidth="6" />

          <g transform="translate(215, 200)">
            {/* Leaves - Top Right */}
            <path d="M 0 0 Q 150 -100 200 0 Q 120 50 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q 100 -50 180 -10" fill="none" stroke="#FEE101" strokeWidth="3" />
            
            {/* Leaves - Right */}
            <path d="M 0 0 Q 150 0 180 100 Q 100 80 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q 100 30 160 80" fill="none" stroke="#FEE101" strokeWidth="3" />

            {/* Leaves - Bottom Right */}
            <path d="M 0 0 Q 100 100 100 200 Q 50 120 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q 60 100 80 180" fill="none" stroke="#FEE101" strokeWidth="3" />

            {/* Leaves - Top Left */}
            <path d="M 0 0 Q -100 -150 -200 -50 Q -100 -20 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q -100 -80 -180 -40" fill="none" stroke="#FEE101" strokeWidth="3" />

            {/* Leaves - Left */}
            <path d="M 0 0 Q -180 -50 -250 50 Q -120 20 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q -120 -20 -220 40" fill="none" stroke="#FEE101" strokeWidth="3" />

            {/* Leaves - Bottom Left */}
            <path d="M 0 0 Q -150 100 -120 250 Q -50 150 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q -80 120 -100 220" fill="none" stroke="#FEE101" strokeWidth="3" />
          </g>
        </svg>
      </div>

      {/* Right Palm Tree */}
      <div className="absolute top-0 right-0 w-[150px] md:w-[450px] h-[100vh] origin-top-right pointer-events-none opacity-50 md:opacity-100">
        <svg viewBox="0 0 400 800" className="w-full h-full" preserveAspectRatio="xMaxYMax slice">
          {/* Trunk */}
          <path d="M 400 800 Q 250 500 200 200 L 170 200 Q 220 500 350 800 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="6" />
          {/* Trunk segments */}
          <path d="M 350 780 Q 310 770 290 785" fill="none" stroke="#000000" strokeWidth="6" />
          <path d="M 320 650 Q 270 630 255 660" fill="none" stroke="#000000" strokeWidth="6" />
          <path d="M 275 500 Q 230 480 220 510" fill="none" stroke="#000000" strokeWidth="6" />
          <path d="M 240 350 Q 210 330 195 360" fill="none" stroke="#000000" strokeWidth="6" />

          <g transform="translate(185, 200)">
            {/* Leaves - Top Left */}
            <path d="M 0 0 Q -150 -100 -200 0 Q -120 50 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q -100 -50 -180 -10" fill="none" stroke="#FEE101" strokeWidth="3" />
            
            {/* Leaves - Left */}
            <path d="M 0 0 Q -150 0 -180 100 Q -100 80 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q -100 30 -160 80" fill="none" stroke="#FEE101" strokeWidth="3" />

            {/* Leaves - Bottom Left */}
            <path d="M 0 0 Q -100 100 -100 200 Q -50 120 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q -60 100 -80 180" fill="none" stroke="#FEE101" strokeWidth="3" />

            {/* Leaves - Top Right */}
            <path d="M 0 0 Q 100 -150 200 -50 Q 100 -20 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q 100 -80 180 -40" fill="none" stroke="#FEE101" strokeWidth="3" />

            {/* Leaves - Right */}
            <path d="M 0 0 Q 180 -50 250 50 Q 120 20 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q 120 -20 220 40" fill="none" stroke="#FEE101" strokeWidth="3" />

            {/* Leaves - Bottom Right */}
            <path d="M 0 0 Q 150 100 120 250 Q 50 150 0 0" fill="#0B6B3F" stroke="#000000" strokeWidth="6" />
            <path d="M 0 0 Q 80 120 100 220" fill="none" stroke="#FEE101" strokeWidth="3" />
          </g>
        </svg>
      </div>



    </div>
  );
}
