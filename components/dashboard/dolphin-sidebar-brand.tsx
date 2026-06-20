type DolphinSidebarBrandProps = {
  collapsed?: boolean;
};

export function DolphinSidebarBrand({
  collapsed = false,
}: DolphinSidebarBrandProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <img
          src="/logo-gold.png"
          alt="Dolphin"
          style={{
            width: "32px",
            height: "32px",
            objectFit: "contain",
            animation: "dolphin-bounce 3s ease-in-out infinite",
          }}
        />
        <svg
          width="40"
          height="10"
          viewBox="0 0 40 10"
          fill="none"
          style={{ marginTop: "-2px" }}
        >
          <path
            d="M0,5 C5,2 10,8 16,5 C22,2 28,8 34,5 C37,3 39,5 40,5"
            stroke="#C9A84C"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          >
            <animate
              attributeName="d"
              dur="1.8s"
              repeatCount="indefinite"
              values="M0,5 C5,2 10,8 16,5 C22,2 28,8 34,5 C37,3 39,5 40,5;
                  M0,5 C5,8 10,2 16,5 C22,8 28,2 34,5 C37,7 39,5 40,5;
                  M0,5 C5,2 10,8 16,5 C22,2 28,8 34,5 C37,3 39,5 40,5"
            />
          </path>
        </svg>
      </div>

      {!collapsed ? (
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "800",
              color: "#C9A84C",
              letterSpacing: "1px",
              lineHeight: 1,
            }}
          >
            DOLPHIN&apos;S
          </div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "3px",
              lineHeight: 1,
              marginTop: "2px",
            }}
          >
            OFFICE
          </div>
        </div>
      ) : null}
    </>
  );
}
