import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import './About.css'

const features = [
  {
    icon: '🖐️',
    title: 'Handcrafted Excellence',
    description: 'Each product is thoughtfully handmade by skilled Indian artisans.',
  },
  {
    icon: '🌿',
    title: 'Sustainable Materials',
    description: 'We prioritize eco-friendly materials and low-impact production practices.',
  },
  {
    icon: '🚚',
    title: 'Reliable Delivery',
    description: 'Fast dispatch and secure delivery with trusted logistics partners.',
  },
  {
    icon: '🤝',
    title: 'Fair Artisan Support',
    description: 'A meaningful share of every purchase goes directly to artisan communities.',
  },
]

const team = [
  {
    name: 'Ananya Verma',
    role: 'Founder & Curator',
    image: '/images/avatars/avatar-ps.svg',
  },
  {
    name: 'Raghav Malhotra',
    role: 'Operations Lead',
    image: '/images/avatars/avatar-rp.svg',
  },
  {
    name: 'Harish Nair',
    role: 'Customer Experience',
    image: '/images/avatars/avatar-hk.svg',
  },
]

const About = () => {
  return (
    <div className="aboutPage">
      <section className="aboutHero">
        <div className="container aboutHeroContent">
          <p className="aboutEyebrow">MLS Handicrafts</p>
          <h1>About Us</h1>
          <p>
            We bring timeless Indian craftsmanship into modern homes with authentic, handcrafted
            decor and gifting collections.
          </p>
        </div>
      </section>

      <section className="aboutStory sectionSpace">
        <div className="container storyGrid">
          <div className="storyImageWrap">
            <img src="/images/products/wooden-box.svg" alt="Traditional handcrafted wooden decor" />
          </div>
          <div className="storyContent">
            <h2>Our Story</h2>
            <p>
              What started as a small artisan collaboration has grown into a curated handicraft
              destination trusted by customers across India. We partner with local makers to preserve
              craft traditions while making their work accessible to contemporary shoppers.
            </p>
            <p>
              From brass figurines to wooden artifacts, each piece tells a story of heritage, skill,
              and cultural pride.
            </p>
            <Link to="/products" className="aboutButtonLink" aria-label="Explore our products">
              <Button>Explore Collection</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="sectionSpace featuresSection">
        <div className="container">
          <h2 className="sectionTitle">Why Customers Choose Us</h2>
          <div className="featuresGrid">
            {features.map((item) => (
              <Card key={item.title} className="featureCard">
                <span className="featureIcon" aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="sectionSpace teamSection">
        <div className="container">
          <h2 className="sectionTitle">Meet Our Team</h2>
          <div className="teamGrid">
            {team.map((member) => (
              <Card key={member.name} className="teamCard">
                <img src={member.image} alt={member.name} className="teamImage" />
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="aboutCta sectionSpace">
        <div className="container ctaBox">
          <h2>Bring Authentic Craftsmanship Home</h2>
          <p>Discover premium handmade pieces crafted with tradition, care, and purpose.</p>
          <Link to="/products" className="aboutButtonLink" aria-label="Shop handcrafted products">
            <Button>Shop Now</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default About
