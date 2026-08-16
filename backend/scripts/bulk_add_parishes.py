"""
One-time bulk import of Diocese of Byumba's real parishes.
Run with: python manage.py shell < scripts/bulk_add_parishes.py

Safe to re-run: uses get_or_create on (diocese, slug), so it won't create
duplicates if run more than once - it'll just update the archdeaconry info
on existing records.
"""
from django.utils.text import slugify
from dioceses.models import Diocese, Parish

diocese = Diocese.objects.get(slug="byumba")

# (name, archdeaconry, archdeacon_name)
PARISHES = [
    ("Kibali", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Cathedral (Byumba)", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Rugandu", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Kageyo", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Mugina", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Bisika", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Rebero", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Gakenke", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Tumba", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Kigarama", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Kavumu", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Gaseke", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Gitovu", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Ngarama", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
    ("Gatsibo", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
    ("Rutoma", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
    ("Mimuri", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
    ("Nyagihanga", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
]

# The Cathedral was already created earlier under the slug "byumba-cathedral"
# - match to that existing record instead of creating a second one.
SLUG_OVERRIDES = {"Cathedral (Byumba)": "byumba-cathedral"}

created_count = 0
updated_count = 0

for name, archdeaconry, archdeacon in PARISHES:
    slug = SLUG_OVERRIDES.get(name, slugify(name))
    parish, created = Parish.objects.get_or_create(
        diocese=diocese,
        slug=slug,
        defaults={"name": name, "archdeaconry": archdeaconry, "archdeacon_name": archdeacon},
    )
    if created:
        created_count += 1
    else:
        parish.archdeaconry = archdeaconry
        parish.archdeacon_name = archdeacon
        parish.save()
        updated_count += 1

print(f"Done. Created {created_count} new parishes, updated {updated_count} existing ones.")
print(f"Total parishes for {diocese.name}: {diocese.parishes.count()}")
