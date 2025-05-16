
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
                brand: {
                    blue: 'hsl(var(--brand-blue))',
                    gold: 'hsl(var(--brand-gold))',
                    burgundy: 'hsl(var(--brand-burgundy))',
                    'light-grey': 'hsl(var(--brand-light-grey))',
                }
			},
			fontFamily: {
				inter: ['Inter', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0) translateX(0)'
					},
					'25%': {
						transform: 'translateY(-20px) translateX(10px)'
					},
					'50%': {
						transform: 'translateY(0) translateX(20px)'
					},
					'75%': {
						transform: 'translateY(20px) translateX(10px)'
					}
				},
				'gradient': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.8s ease-out forwards',
				'float': 'float 20s infinite ease-in-out',
				'gradient': 'gradient 15s ease infinite'
			},
			typography: {
				DEFAULT: {
					css: {
						color: 'var(--tw-prose-body)',
						maxWidth: '100%',
						'h1, h2, h3, h4, h5, h6': {
							color: 'var(--tw-prose-headings)',
							fontWeight: '600',
							marginTop: '1.5em',
							marginBottom: '0.75em'
						},
						'h1': {
							fontSize: '2rem',
							lineHeight: '2.5rem'
						},
						'h2': {
							fontSize: '1.5rem',
							lineHeight: '2rem'
						},
						'h3': {
							fontSize: '1.25rem',
							lineHeight: '1.75rem'
						},
						'p': {
							marginTop: '1em',
							marginBottom: '1em'
						},
						'ul': {
							marginTop: '1em',
							marginBottom: '1em'
						},
						'li': {
							marginTop: '0.25em',
							marginBottom: '0.25em'
						},
						'strong': {
							fontWeight: '600',
							color: 'var(--tw-prose-bold)'
						},
						'blockquote': {
							fontStyle: 'italic',
							borderLeftWidth: '0.25rem',
							borderLeftColor: 'var(--tw-prose-quote-borders)',
							paddingLeft: '1em',
							marginTop: '1.5em',
							marginBottom: '1.5em'
						},
						'.law-reference': {
							fontWeight: '500',
							padding: '0.125rem 0.25rem',
							borderRadius: '0.25rem',
							backgroundColor: 'rgba(0, 128, 96, 0.1)',
							border: '1px solid rgba(0, 128, 96, 0.2)'
						},
						'.law-reference.statute': {
							backgroundColor: 'rgba(16, 185, 129, 0.1)', 
							borderColor: 'rgba(16, 185, 129, 0.3)'
						},
						'.law-reference.case': {
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							borderColor: 'rgba(59, 130, 246, 0.3)'
						}
					}
				},
				lg: {
					css: {
						'h1': {
							fontSize: '2.25rem',
							lineHeight: '2.5rem'
						},
						'h2': {
							fontSize: '1.75rem',
							lineHeight: '2.25rem'
						},
						'h3': {
							fontSize: '1.5rem',
							lineHeight: '2rem'
						}
					}
				},
				sm: {
					css: {
						fontSize: '0.875rem',
						lineHeight: '1.5rem',
						'h1': {
							fontSize: '1.5rem',
							lineHeight: '2rem'
						},
						'h2': {
							fontSize: '1.25rem',
							lineHeight: '1.75rem'
						},
						'h3': {
							fontSize: '1.125rem',
							lineHeight: '1.75rem'
						}
					}
				}
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require("@tailwindcss/typography")
	],
} satisfies Config;
