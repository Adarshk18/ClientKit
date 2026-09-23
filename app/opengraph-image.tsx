import { ImageResponse } from "next/og";

export const alt = "Client Kit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          backgroundColor: "#F3F5F8",
          color: "#15202B",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              backgroundColor: "#0F6E6A",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            CK
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                letterSpacing: -1.2,
                lineHeight: 1.1,
              }}
            >
              Client Kit
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#0F6E6A",
                letterSpacing: -0.3,
              }}
            >
              Proposal. Sign. Get paid.
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 900,
            fontSize: 28,
            lineHeight: 1.45,
            color: "#5B6575",
            fontWeight: 500,
          }}
        >
          One page for a freelancer job — write the proposal, get a signature,
          collect the deposit. $12 a month. No CRM.
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#5B6575",
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: "#0F6E6A",
            }}
          />
          client-kit-omega.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
