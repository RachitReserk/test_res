"use client"

import { motion } from "framer-motion"
import { Facebook, Instagram, Twitter } from "lucide-react"

interface FooterProps {
  restaurantName?: string
  establishedYear?: string
  tagline?: string
  address?: string
  phoneNumber?: string
  email?: string
  hours?: {
    weekdays: string
    weekends: string
  }
}

export function Footer({
  restaurantName = "TERIYAKI BOWL",
  establishedYear = "1974",
  tagline = "Best Bagel in the New York City",
  address = "24-17 149th Street Whitestone, NY 11357",
  phoneNumber = "(718) 762-7700",
  email = "info@teriyakibowl.com",
  hours = {
    weekdays: "6:00 AM - 2:00 PM",
    weekends: "7:00 AM - 3:00 PM",
  },
}: FooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="bg-gradient-to-b from-gray-800 to-gray-900 text-white p-8 mt-8 shadow-lg"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -top-2 -left-2 w-10 h-10 border-t border-l border-blue-400 opacity-50" />
          <h3 className="text-xl font-bold mb-4 text-blue-100">{restaurantName}</h3>
          <p className="text-gray-300 leading-relaxed">
            Est. {establishedYear}, {tagline}
          </p>
          <p className="text-gray-300 mt-2 leading-relaxed">{address}</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -top-2 -left-2 w-10 h-10 border-t border-l border-blue-400 opacity-50" />
          <h3 className="text-xl font-bold mb-4 text-blue-100">Hours</h3>
          <p className="text-gray-300 leading-relaxed">Monday - Friday: {hours.weekdays}</p>
          <p className="text-gray-300 leading-relaxed">Saturday - Sunday: {hours.weekends}</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -top-2 -left-2 w-10 h-10 border-t border-l border-blue-400 opacity-50" />
          <h3 className="text-xl font-bold mb-4 text-blue-100">Contact</h3>
          <p className="text-gray-300 leading-relaxed">Phone: {phoneNumber}</p>
          <p className="text-gray-300 leading-relaxed">Email: {email}</p>
          <div className="flex gap-6 mt-6">
            <motion.a
              whileHover={{ y: -3, color: "#4299e1" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              href="#"
              className="text-gray-300 hover:text-blue-400"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </motion.a>
            <motion.a
              whileHover={{ y: -3, color: "#4299e1" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              href="#"
              className="text-gray-300 hover:text-blue-400"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </motion.a>
            <motion.a
              whileHover={{ y: -3, color: "#4299e1" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              href="#"
              className="text-gray-300 hover:text-blue-400"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </motion.a>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-400"
      >
        <p>
          © {new Date().getFullYear()} {restaurantName}. All rights reserved.
        </p>
      </motion.div>
    </motion.footer>
  )
}
