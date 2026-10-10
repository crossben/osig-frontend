import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Social preview (1200x630) generated at build time
export const alt = 'OSIG: see what the public internet already knows';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="#16233B" stroke="#2C3F64"/><g stroke="#7FA0D6" stroke-width="1.6" stroke-linecap="round"><line x1="15.81" y1="16.19" x2="24.17" y2="7.83"/><line x1="17.52" y1="19.08" x2="25.79" y2="16.65"/><line x1="13.43" y1="14.65" x2="16.68" y2="6.15"/><line x1="17.55" y1="22.84" x2="24.98" y2="24.93"/></g><circle cx="26.5" cy="5.5" r="2.7" fill="#F2E85C"/><circle cx="28" cy="16" r="1.7" fill="#7FA0D6"/><circle cx="17.5" cy="4" r="1.7" fill="#7FA0D6"/><circle cx="27" cy="25.5" r="1.5" fill="#7FA0D6"/><circle cx="11" cy="21" r="5.2" fill="none" stroke="#E6ECF5" stroke-width="2.8"/><circle cx="11" cy="21" r="1.6" fill="#E6ECF5"/></svg>`;
const markUri = `data:image/svg+xml;base64,${Buffer.from(mark).toString('base64')}`;

export default async function OpengraphImage() {
  // Static ExtraBold instance of Bricolage Grotesque (OFL, see fonts/OFL.txt)
  const bricolage = await readFile(join(process.cwd(), 'src/app/fonts/BricolageGrotesque-ExtraBold.ttf'));
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: '#0F1A2E', color: '#E6ECF5', padding: '72px 80px', fontFamily: 'Bricolage',
          backgroundImage: 'linear-gradient(rgba(230,236,245,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(230,236,245,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* ImageResponse renders plain <img>; next/image doesn't apply here */}
          {/* oxlint-disable-next-line nextjs/no-img-element */}
          <img src={markUri} width={72} height={72} alt="" />
          <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em' }}>OSIG</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.03em', maxWidth: 900 }}>
            See what the public internet already knows.
          </span>
          <span style={{ fontSize: 30, color: '#93A2BB', maxWidth: 900, fontFamily: 'sans-serif', fontWeight: 400 }}>
            Trace an email, username, domain or phone number across public sources, linked back to where each finding came from.
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Bricolage', data: bricolage, weight: 800, style: 'normal' }] },
  );
}
