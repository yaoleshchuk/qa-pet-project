@API @Smoke
# Priority: Low
Feature: View hotel details

  Scenario: Get full info about hotel
    When I send GET request to /api/hotel/321
    Then response should contain hotel name, rating and address
