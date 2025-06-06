@API @Acceptance
# Priority: High
Feature: Hotel search by city

  Scenario Outline: Search for hotels in "<city>"
    When I send GET request to /api/hotels?city=<city>
    Then the response status code should be 200
    And response should contain hotels in "<city>"

    Examples:
      | city      |
      | Paris     |
      | Rome      |
      | Bangkok   |
