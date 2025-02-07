from django.urls import path
from WIND.views import test_api

urlpatterns = [
    path("test/", test_api),
]