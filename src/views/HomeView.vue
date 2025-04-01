<script setup lang="ts">
import Button from 'primevue/button';

const features = [
  {
    title: 'Intuitive Dashboard',
    description: 'Access all your data and tools in one centralized, user-friendly interface.',
    icon: 'pi pi-chart-line'
  },
  {
    title: 'Real-time Analytics',
    description: 'Monitor key metrics and performance indicators with up-to-the-minute accuracy.',
    icon: 'pi pi-chart-bar'
  },
  {
    title: 'Secure Access',
    description: 'Enterprise-grade security with end-to-end encryption and multi-factor authentication.',
    icon: 'pi pi-shield'
  },
  {
    title: 'Cross-platform',
    description: 'Access your workspace from any device, anywhere, anytime.',
    icon: 'pi pi-mobile'
  }
];

const testimonials = [
  {
    quote: "This platform has completely transformed how our team collaborates and manages projects.",
    author: "Alex Chen",
    position: "CTO, TechInnovate"
  },
  {
    quote: "The analytics capabilities have given us insights we never knew were possible before.",
    author: "Sarah Johnson",
    position: "Data Analyst, DataDrive"
  },
  {
    quote: "Implementing this solution cut our process time in half while doubling productivity.",
    author: "Michael Rivera",
    position: "Operations Manager, OptiFlow"
  }
];
</script>

<template>
  <div class="relative min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
    <!-- Decorative floating shapes -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="floating-shape shape1"></div>
      <div class="floating-shape shape2"></div>
      <div class="floating-shape shape3"></div>
    </div>

    <!-- Header/Navigation -->
    <header class="relative z-10 py-6 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="text-2xl font-bold text-white">The Parking Hub</div>
        <nav class="hidden md:flex space-x-8">
          <a href="#features" class="text-blue-200 hover:text-white transition-colors">Features</a>
          <a href="#testimonials" class="text-blue-200 hover:text-white transition-colors">Testimonials</a>
          <a href="#pricing" class="text-blue-200 hover:text-white transition-colors">Pricing</a>
        </nav>
        <div class="flex space-x-4">
          <RouterLink to="/sign-in">
            <Button label="Sign In" class="p-button-text text-blue-300 hover:text-blue-200" />
          </RouterLink>
          <RouterLink to="/sign-up">
            <Button label="Get Started"
              class="p-button p-button-outlined border-blue-400 text-blue-400 hover:bg-blue-900/20" />
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div class="max-w-7xl mx-auto">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Elevate Your Workflow with Parking Hub
          </h1>
          <p class="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
            The all-in-one platform designed to streamline your operations, enhance collaboration, and drive results in
            today's digital landscape.
          </p>
          <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <RouterLink to="/sign-up">
              <Button label="Start Free Trial" class="p-button p-button-lg bg-gradient-to-r from-blue-600 to-blue-400 
                    border-none hover:from-blue-700 hover:to-blue-500 text-white px-8 py-3" />
            </RouterLink>
            <Button label="Watch Demo" class="p-button p-button-lg p-button-outlined border-white/20 text-white 
                  hover:bg-white/5 px-8 py-3 flex items-center justify-center">
              <i class="pi pi-play mr-2"></i> Watch Demo
            </Button>
          </div>

          <!-- Mock Dashboard Preview (glassy effect) -->
          <div class="relative backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 shadow-2xl 
               p-2 max-w-4xl mx-auto overflow-hidden">
            <div class="aspect-[16/9] bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl 
                 flex items-center justify-center">
              <div class="text-center p-12">
                <div class="text-sm text-blue-300 mb-4">DASHBOARD PREVIEW</div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div v-for="i in 4" :key="i"
                    class="h-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <div class="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <i class="pi pi-chart-line text-blue-400"></i>
                    </div>
                  </div>
                </div>
                <div class="h-40 w-full rounded-lg bg-white/5 border border-white/10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 bg-slate-950/50">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-white mb-4">Powerful Features</h2>
          <p class="text-lg text-blue-200 max-w-2xl mx-auto">
            Discover how Parking Hub can help you achieve more with less effort.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="(feature, index) in features" :key="index" class="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-6 
                     transition-all duration-300 hover:transform hover:-translate-y-2 hover:bg-white/10">
            <div class="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <i :class="feature.icon + ' text-blue-400'"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">{{ feature.title }}</h3>
            <p class="text-blue-200">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="relative z-10 px-4 sm:px-6 lg:px-8 py-24">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-white mb-4">What Our Users Say</h2>
          <p class="text-lg text-blue-200 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have transformed their workflow with Parking Hub.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(testimonial, index) in testimonials" :key="index"
            class="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-6">
            <div class="text-blue-400 text-4xl mb-4">"</div>
            <p class="text-white mb-6 italic">{{ testimonial.quote }}</p>
            <div>
              <div class="font-bold text-white">{{ testimonial.author }}</div>
              <div class="text-blue-300 text-sm">{{ testimonial.position }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 bg-slate-950/50">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p class="text-lg text-blue-200 max-w-2xl mx-auto">
            Choose the plan that works best for your needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <!-- Starter Plan -->
          <div class="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col">
            <h3 class="text-xl font-bold text-white mb-2">Starter</h3>
            <div class="text-3xl font-bold text-white mb-1">$29<span
                class="text-lg text-blue-300 font-normal">/mo</span></div>
            <p class="text-blue-200 mb-6">Perfect for small teams and startups</p>
            <ul class="space-y-3 mb-8">
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> Up to 5 team members
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> Basic analytics
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> 5GB storage
              </li>
            </ul>
            <Button label="Get Started" class="p-button p-button-outlined border-blue-400 text-blue-400 
                  hover:bg-blue-900/20 mt-auto" />
          </div>

          <!-- Pro Plan (Highlighted) -->
          <div class="backdrop-blur-sm bg-gradient-to-b from-blue-900/40 to-blue-900/10 rounded-xl border border-blue-400/30 p-6 
                flex flex-col relative transform scale-105 shadow-xl">
            <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white 
                 px-4 py-1 rounded-full text-sm font-bold">MOST POPULAR</div>
            <h3 class="text-xl font-bold text-white mb-2">Professional</h3>
            <div class="text-3xl font-bold text-white mb-1">$79<span
                class="text-lg text-blue-300 font-normal">/mo</span></div>
            <p class="text-blue-200 mb-6">Ideal for growing businesses</p>
            <ul class="space-y-3 mb-8">
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> Up to 20 team members
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> Advanced analytics
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> 25GB storage
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> Priority support
              </li>
            </ul>
            <Button label="Get Started" class="p-button bg-gradient-to-r from-blue-600 to-blue-400 
                  border-none hover:from-blue-700 hover:to-blue-500 text-white mt-auto" />
          </div>

          <!-- Enterprise Plan -->
          <div class="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col">
            <h3 class="text-xl font-bold text-white mb-2">Enterprise</h3>
            <div class="text-3xl font-bold text-white mb-1">$199<span
                class="text-lg text-blue-300 font-normal">/mo</span></div>
            <p class="text-blue-200 mb-6">For large organizations</p>
            <ul class="space-y-3 mb-8">
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> Unlimited team members
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> Custom analytics
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> 100GB storage
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> 24/7 dedicated support
              </li>
              <li class="flex items-center text-blue-100">
                <i class="pi pi-check text-green-400 mr-2"></i> Custom integrations
              </li>
            </ul>
            <Button label="Contact Sales" class="p-button p-button-outlined border-blue-400 text-blue-400 
                  hover:bg-blue-900/20 mt-auto" />
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-24">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
        <p class="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
          Join thousands of teams already using Parking Hub to streamline their operations and boost productivity.
        </p>
        <RouterLink to="/sign-up">
          <Button label="Start Your Free Trial" class="p-button p-button-lg bg-gradient-to-r from-blue-600 to-blue-400 
                border-none hover:from-blue-700 hover:to-blue-500 text-white px-8 py-3" />
        </RouterLink>
        <p class="text-blue-300 mt-4 text-sm">No credit card required. 14-day free trial.</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative z-10 px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 class="text-white font-bold mb-4">Product</h4>
            <ul class="space-y-2">
              <li><a href="#" class="text-blue-300 hover:text-white">Features</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Pricing</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Integrations</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4">Resources</h4>
            <ul class="space-y-2">
              <li><a href="#" class="text-blue-300 hover:text-white">Documentation</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Guides</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">API Reference</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Community</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4">Company</h4>
            <ul class="space-y-2">
              <li><a href="#" class="text-blue-300 hover:text-white">About</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Blog</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Careers</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4">Legal</h4>
            <ul class="space-y-2">
              <li><a href="#" class="text-blue-300 hover:text-white">Privacy</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Terms</a></li>
              <li><a href="#" class="text-blue-300 hover:text-white">Security</a></li>
            </ul>
          </div>
        </div>
        <div class="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <div class="text-blue-300 mb-4 md:mb-0">© 2025 The Parking Hub. All rights reserved.</div>
          <div class="flex space-x-6">
            <a href="#" class="text-blue-300 hover:text-white">
              <i class="pi pi-twitter"></i>
            </a>
            <a href="#" class="text-blue-300 hover:text-white">
              <i class="pi pi-github"></i>
            </a>
            <a href="#" class="text-blue-300 hover:text-white">
              <i class="pi pi-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Inherit the floating shape animations from your login page */
.floating-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  filter: blur(40px);
  animation: float 20s infinite;
}

.shape1 {
  width: 300px;
  height: 300px;
  background: rgb(37, 99, 235);
  top: -100px;
  left: -100px;
  animation-delay: -2s;
}

.shape2 {
  width: 400px;
  height: 400px;
  background: rgb(29, 78, 216);
  bottom: -150px;
  right: -150px;
  animation-delay: -5s;
}

.shape3 {
  width: 200px;
  height: 200px;
  background: rgb(59, 130, 246);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -7s;
}

@keyframes float {

  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }

  25% {
    transform: translate(50px, 50px) rotate(90deg);
  }

  50% {
    transform: translate(0, 100px) rotate(180deg);
  }

  75% {
    transform: translate(-50px, 50px) rotate(270deg);
  }
}

/* PrimeVue button styling overrides */
:deep(.p-button) {
  border-radius: 0.5rem;
}

:deep(.p-button-lg) {
  font-weight: 500;
  font-size: 1rem;
}
</style>
