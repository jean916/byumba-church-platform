from django.contrib import admin
from .models import Group, Announcement, Event, GroupMember, Song, GroupPhoto, Sermon

admin.site.register(Group)
admin.site.register(Announcement)
admin.site.register(Event)
admin.site.register(GroupMember)
admin.site.register(Song)
admin.site.register(GroupPhoto)
admin.site.register(Sermon)
