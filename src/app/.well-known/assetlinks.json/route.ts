import { NextResponse } from 'next/server';

export async function GET() {
  const assetlinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.locagestion.app',
        sha256_cert_fingerprints: [
          '17:D7:54:87:D1:95:11:84:F3:97:FC:6C:52:5F:A5:12:ED:EE:E5:AF:D4:82:BC:EE:5A:62:3A:89:C4:B2:A3:8F',
        ],
      },
    },
  ];

  return NextResponse.json(assetlinks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

