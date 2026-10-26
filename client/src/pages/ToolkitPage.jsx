import Gallery from '../components/Gallery.jsx';
import Icon from '../components/Icon.jsx';
import ResourceList from '../components/ResourceList.jsx';
import { gallery, resources } from '../data.js';

function ToolkitPage({ query }) {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleResources = resources.filter((resource) =>
    `${resource.title} ${resource.meta}`.toLowerCase().includes(normalizedQuery),
  );

  return (
    <>
      <section className="page-head" aria-labelledby="toolkit-title">
        <div className="container">
          <span className="badge-pill">
            <Icon name="rocket" size={16} />
            Steal these
          </span>
          <h1 className="page-head__title" id="toolkit-title">The Toolkit</h1>
          <p className="hero__lead">
            Cheat sheets, live crew rosters and checklists. Grab what you need and get back to shipping.
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-12 col-lg-7">
              <article className="bento-card" aria-labelledby="toolkit-resources-title">
                <div className="bento-card__head">
                  <div>
                    <h2 id="toolkit-resources-title">E-Resources</h2>
                    <p>Rosters download fresh from the database every time.</p>
                  </div>
                </div>
                <ResourceList items={visibleResources} />
              </article>
            </div>

            <div className="col-12 col-lg-5">
              <article className="bento-card" aria-labelledby="toolkit-gallery-title">
                <div className="bento-card__head">
                  <div>
                    <h2 id="toolkit-gallery-title">Gallery</h2>
                    <p>Need a spark? Here's what the crew shipped.</p>
                  </div>
                </div>
                <Gallery items={gallery} />
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ToolkitPage;
