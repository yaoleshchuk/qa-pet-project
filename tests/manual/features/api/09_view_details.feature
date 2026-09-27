@API @Smoke
# Priority: Low
Feature: View hotel details

  Scenario: Get full info about hotel
    When I send GET request to /api/hotel/321
    Then the response status code should be 200
    And response should contain hotel name, rating and address
