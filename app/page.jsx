import EventBrowser from '../components/EventBrowser';
export default function Home() {
  return <>
    <a className="skip-link" href="#events">Skip to events</a>
    <header className="site-header"><a className="brand" href="/" aria-label="Tartan Tickets home"><span className="brand-mark" aria-hidden="true">tt</span>Tartan Tickets</a><span className="header-label">Made for campus life</span></header>
    <main id="events">
      <section className="hero"><p className="eyebrow">GOOD TIMES START HERE</p><h1>Your campus.<br/>Your next great night.</h1><p className="hero-description">Find something to look forward to. Explore upcoming student club events, all in one place.</p><p className="demo-label">Browsing demo · All events are fictional</p></section>
      <EventBrowser />
    </main>
    <footer>Tartan Tickets <span>Campus plans, made simple.</span></footer>
  </>;
}
