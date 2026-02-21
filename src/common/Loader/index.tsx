const Loader = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-white dark:bg-boxdark">
      <img
        src="/logo.png"
        alt=""
        className="h-44 w-44 object-contain border-0 bg-transparent shadow-none outline-none dark:brightness-110"
        width={176}
        height={176}
      />
      <span className="text-xl font-bold tracking-wide text-[#3c50e0]">
        OpsDigital
      </span>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-gray-200 dark:bg-meta-4">
        <div
          className="h-full rounded-full bg-primary"
          style={{
            animation: 'loader-bar 1.2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};

export default Loader;
