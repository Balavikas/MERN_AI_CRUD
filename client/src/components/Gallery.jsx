import Icon from './Icon.jsx';

function Gallery({ items }) {
  return (
    <ul className="gallery row row-cols-2 row-cols-sm-3 g-2">
      {items.map((project) => (
        <li key={project.id}>
          <figure className={`gallery__tile gallery__tile--${project.tint}`}>
            <Icon name={project.icon} size={28} />
            <figcaption>
              <span className="gallery__title">{project.title}</span>
              <span className="gallery__author">by {project.author}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

export default Gallery;
