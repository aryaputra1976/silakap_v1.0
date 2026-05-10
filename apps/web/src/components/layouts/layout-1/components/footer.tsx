export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1  gap-2 font-normal text-sm">
            <span className="text-muted-foreground">{currentYear} &copy;</span>
            <span className="text-secondary-foreground">
              SILAKAP BKPSDM Kabupaten Tolitoli
            </span>
          </div>
          <nav className="flex order-1 md:order-2 gap-4 font-normal text-sm text-muted-foreground">
            <span>SIAP</span>
            <span>SIDATA</span>
            <span>SIPENSIUN</span>
            <span>SIARSIP</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
