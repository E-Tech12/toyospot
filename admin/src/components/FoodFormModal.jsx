import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { FormField, TextAreaField, SelectField, CheckboxField } from './FormField'
import { foodApi } from '../lib/endpoints'
import { ApiError } from '../lib/api'

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function FoodFormModal({ food, categories, onClose, onSaved }) {
  const isEdit = !!food
  const [form, setForm] = useState({
    name: food?.name || '',
    slug: food?.slug || '',
    description: food?.description || '',
    category_slug: food?.category_slug || categories[0]?.slug || '',
    price: food?.price ?? '',
    daily_quantity: food?.daily_quantity ?? '',
    quantity_available: food?.quantity_available ?? '',
    prep_time_minutes: food?.prep_time_minutes ?? 15,
    is_featured: food?.is_featured || false,
    is_popular: food?.is_popular || false,
    image_url: food?.image_url || ''
  })
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(food?.image_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleNameChange = (value) => {
    setForm((f) => ({ ...f, name: value, slug: slugTouched ? f.slug : slugify(value) }))
  }

  const handleImagePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.slug || !form.category_slug || !form.price) {
      setError('Fill in name, slug, category, and price.')
      return
    }

    const category = categories.find((c) => c.slug === form.category_slug)
    if (!category) {
      setError('Pick a valid category.')
      return
    }

    setSaving(true)
    try {
      let imageUrl = form.image_url
      if (imageFile && !isEdit) {
        const uploaded = await foodApi.uploadImage(imageFile)
        imageUrl = uploaded.url
      }

      const payload = {
        name: form.name,
        description: form.description,
        category_id: category.id,
        price: Number(form.price),
        daily_quantity: Number(form.daily_quantity) || 0,
        quantity_available: Number(form.quantity_available) || 0,
        prep_time_minutes: Number(form.prep_time_minutes) || 15,
        is_featured: form.is_featured,
        is_popular: form.is_popular,
        image_url: imageUrl
      }

      let saved
      if (isEdit) {
        saved = await foodApi.update(food.id, payload)
        if (imageFile) {
          saved = await foodApi.uploadImageForFood(food.id, imageFile)
        }
      } else {
        saved = await foodApi.create({ ...payload, slug: form.slug })
      }
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this food.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit food' : 'Add food'} onClose={onClose} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-28 h-28 rounded-xl bg-cream border border-border overflow-hidden shrink-0 grid place-items-center">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-muted text-center px-2">No image</span>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-ink mb-1.5">Photo</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImagePick} className="text-sm" />
            <p className="text-xs text-muted mt-1.5">JPEG, PNG or WebP, up to 5MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Jollof Rice" />
          <FormField
            label="Slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true)
              setForm({ ...form, slug: slugify(e.target.value) })
            }}
            placeholder="jollof-rice"
            disabled={isEdit}
            hint={isEdit ? "Slugs can't be changed after creation" : undefined}
          />
        </div>

        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="Smoky party-style jollof rice..."
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Category" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </SelectField>
          <FormField label="Price (₦)" type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField
            label="Daily quantity"
            type="number"
            min="0"
            value={form.daily_quantity}
            onChange={(e) => setForm({ ...form, daily_quantity: e.target.value })}
            hint="Restocked each morning"
          />
          <FormField
            label="Available now"
            type="number"
            min="0"
            value={form.quantity_available}
            onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
          />
          <FormField
            label="Prep time (min)"
            type="number"
            min="1"
            value={form.prep_time_minutes}
            onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })}
          />
        </div>

        <div className="flex gap-6">
          <CheckboxField
            label="Featured on homepage"
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
          />
          <CheckboxField
            label="Popular (fallback before order data exists)"
            checked={form.is_popular}
            onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Add food'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
