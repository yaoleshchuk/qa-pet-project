@API @Smoke
# Priority: Low
Feature: Currency conversion

  Scenario Outline: Get prices in "<currency>"
    When I send GET request to /api/hotels?city=Paris&currency=<currency>
    Then the response status code should be 200
    And all hotel prices should be in "<symbol>"

    Examples:
      | currency | symbol |
      | USD      | $      |
      | EUR      | €      |
      | GBP      | £      |
