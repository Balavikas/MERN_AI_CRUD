import CrewStats from './CrewStats.jsx';
import Gallery from './Gallery.jsx';
import Icon from './Icon.jsx';
import ResourceList from './ResourceList.jsx';
import SignupForm from './SignupForm.jsx';
import useRecords from '../hooks/useRecords.js';
import { gallery, resources } from '../data.js';

function BentoGrid({ onNavigate }) {
  const learners = useRecords('/api/registrations', 'learners');
  const mentors = useRecords('/api/tutors', 'mentors');

  return (
    <section className="section" aria-labelledby="launchpad-title">
      <div className="container">
        <div className="section__head">
          <div>
            <h2 id="launchpad-title">Your launchpad</h2>
            <p className="section__sub">Run the crew, grab the tools, ship the thing.</p>
          </div>
        </div>

        <div className="bento">
          <article className="bento-card bento-card--crew" aria-labelledby="bento-crew-title">
            <div className="bento-card__head">
              <div>
                <h3 id="bento-crew-title">Manage Crew</h3>
                <p>Your people, live from Postgres and MongoDB.</p>
              </div>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => onNavigate('crew')}>
                Open crew HQ
                <Icon name="arrowRight" size={16} />
              </button>
            </div>
            <CrewStats learners={learners} mentors={mentors} />
          </article>

          <article className="bento-card bento-card--join" id="join" aria-labelledby="bento-join-title">
            <div className="bento-card__head">
              <div>
                <h3 id="bento-join-title">Join the Movement</h3>
                <p>Bring a friend in. They get their own SkillStack account.</p>
              </div>
            </div>
            <SignupForm
              idPrefix="join"
              submitLabel="Add to the crew"
              successMessage={(account) => `${account.full_name.split(' ')[0]} is in! Welcome to the crew.`}
              onCreated={learners.reload}
            />
          </article>

          <article className="bento-card bento-card--resources" aria-labelledby="bento-resources-title">
            <div className="bento-card__head">
              <div>
                <h3 id="bento-resources-title">E-Resources</h3>
                <p>Cheat sheets and live rosters, one click away.</p>
              </div>
            </div>
            <ResourceList items={resources.slice(0, 3)} />
            <button type="button" className="text-link" onClick={() => onNavigate('toolkit')}>
              See the full toolkit
              <Icon name="arrowRight" size={16} />
            </button>
          </article>

          <article className="bento-card bento-card--gallery" id="gallery" aria-labelledby="bento-gallery-title">
            <div className="bento-card__head">
              <div>
                <h3 id="bento-gallery-title">Gallery</h3>
                <p>Real projects the crew shipped this month.</p>
              </div>
            </div>
            <Gallery items={gallery} />
          </article>
        </div>
      </div>
    </section>
  );
}

export default BentoGrid;
